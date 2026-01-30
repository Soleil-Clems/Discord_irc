import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Users } from '@/users/entities/users.entity';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { ServerRole } from './enums/server-role.enum';

import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,

    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
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

  async findAll() {
    return this.serverRepository.find({
      relations: {
        memberships: {
          members: true,
        },
      },
    });
  }

  async findOne(serverId: number) {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
      relations: {
        memberships: {
          members: true,
        },
        channels: {
          server: false,
        },
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
    // return this.serverMemberRepository.save(target);
    return target;
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
}
