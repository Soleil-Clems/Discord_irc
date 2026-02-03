import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { Users } from '@/users/entities/users.entity';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { Invitation } from './entities/invitation.entity';
import { ServerRole } from './enums/server-role.enum';

import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,

    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,

    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
  ) {}

  async create(createServerDto: CreateServerDto, userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const server = this.serverRepository.create({
      name: createServerDto.name,
    });
    await this.serverRepository.save(server);

    const ownerMembership = this.serverMemberRepository.create({
      members: user,
      server: server,
      role: ServerRole.Owner,
    });

    await this.serverMemberRepository.save(ownerMembership);

    return server;
  }

  async findAll(userId: number) {
    const memberships = await this.serverMemberRepository.find({
      where: {
        members: { id: userId },
      },
      relations: {
        server: {
          channels: true,
          memberships: {
            members: true,
          },
        },
      },
    });

    return memberships.map((membership) => membership.server);
  }

  async findOne(serverId: number, userId: number) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous ne faites pas partie de ce serveur');
    }

    const server = await this.serverRepository.findOne({
      where: { id: serverId },
      relations: {
        memberships: {
          members: true,
        },
        channels: true,
      },
    });

    if (!server) {
      throw new NotFoundException('Serveur non trouvé');
    }

    return server;
  }

  async update(
    serverId: number,
    updateServerDto: UpdateServerDto,
    userId: number,
  ) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
      relations: {
        server: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous ne faites pas partie du serveur');
    }

    if (membership.role !== ServerRole.Owner) {
      throw new ForbiddenException(
        'Seul le propriétaire peut modifier le serveur',
      );
    }

    Object.assign(membership.server, updateServerDto);
    return this.serverRepository.save(membership.server);
  }

  async remove(serverId: number, userId: number) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
      relations: {
        server: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Accès refusé');
    }

    if (membership.role !== ServerRole.Owner) {
      throw new ForbiddenException(
        'Seul le propriétaire peut supprimer le serveur',
      );
    }

    await this.serverRepository.remove(membership.server);

    return { success: true };
  }

  async joinServer(serverId: number, userId: number) {
    const exists = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (exists) {
      throw new ForbiddenException('Déjà membre');
    }

    const member = this.serverMemberRepository.create({
      server: { id: serverId },
      members: { id: userId },
      role: ServerRole.Member,
    });

    return this.serverMemberRepository.save(member);
  }

  async changeMemberRole(
    serverId: number,
    requesterId: number,
    targetMemberId: number,
    role: ServerRole,
  ) {
    const requester = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: requesterId },
      },
    });

    if (!requester || requester.role !== ServerRole.Owner) {
      throw new ForbiddenException('Seul le OWNER peut changer les rôles');
    }

    const target = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: targetMemberId },
      },
    });

    if (!target) {
      throw new NotFoundException('Membre introuvable');
    }

    target.role = role;
    return this.serverMemberRepository.save(target);
  }

  async leaveServer(serverId: number, userId: number, newOwnerId?: number) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Vous ne faites pas partie du serveur');
    }

    if (membership.role === ServerRole.Owner) {
      if (!newOwnerId) {
        throw new ForbiddenException('Le OWNER doit transférer la propriété');
      }

      const newOwner = await this.serverMemberRepository.findOne({
        where: {
          server: { id: serverId },
          members: { id: newOwnerId },
        },
      });

      if (!newOwner) {
        throw new NotFoundException('Nouveau OWNER invalide');
      }

      newOwner.role = ServerRole.Owner;
      await this.serverMemberRepository.save(newOwner);
    }

    await this.serverMemberRepository.remove(membership);
    return { success: true };
  }

  async createInvitation(
    serverId: number,
    userId: number,
    dto: CreateInvitationDto,
  ) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous ne faites pas partie du serveur');
    }

    if (
      membership.role !== ServerRole.Owner &&
      membership.role !== ServerRole.Admin
    ) {
      throw new ForbiddenException(
        'Seuls les admins peuvent créer des invitations',
      );
    }

    const code = crypto.randomBytes(8).toString('hex');

    const expiresAt = dto.expiresIn
      ? new Date(Date.now() + dto.expiresIn * 1000)
      : null;

    const invitation = new Invitation();
    invitation.code = code;
    invitation.serverId = serverId;
    invitation.createdBy = userId;
    invitation.expiresAt = expiresAt;
    invitation.maxUses = dto.maxUses || null;

    await this.invitationRepository.save(invitation);

    return {
      id: invitation.id,
      code: invitation.code,
      maxUses: invitation.maxUses,
      usesCount: invitation.usesCount,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async getServerInvitations(serverId: number, userId: number) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous ne faites pas partie du serveur');
    }

    if (
      membership.role !== ServerRole.Owner &&
      membership.role !== ServerRole.Admin
    ) {
      throw new ForbiddenException(
        'Seuls les admins peuvent voir les invitations',
      );
    }

    return this.invitationRepository.find({
      where: { serverId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteInvitation(
    serverId: number,
    invitationId: number,
    userId: number,
  ) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous ne faites pas partie du serveur');
    }

    if (
      membership.role !== ServerRole.Owner &&
      membership.role !== ServerRole.Admin
    ) {
      throw new ForbiddenException(
        'Seuls les admins peuvent supprimer des invitations',
      );
    }

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, serverId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée');
    }

    await this.invitationRepository.remove(invitation);

    return { success: true };
  }

  async joinByCode(code: string, userId: number) {
    const invitation = await this.invitationRepository.findOne({
      where: { code },
      relations: ['server'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation invalide');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expirée');
    }

    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      throw new BadRequestException(
        "L'invitation a atteint le nombre maximum d'utilisations",
      );
    }

    const existingMembership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: invitation.serverId },
        members: { id: userId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('Vous êtes déjà membre de ce serveur');
    }

    const member = this.serverMemberRepository.create({
      server: { id: invitation.serverId },
      members: { id: userId },
      role: ServerRole.Member,
    });

    await this.serverMemberRepository.save(member);

    invitation.usesCount += 1;
    await this.invitationRepository.save(invitation);

    return {
      message: 'Vous avez rejoint le serveur',
      server: invitation.server,
    };
  }
}
