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
import { ServerBan } from './entities/server-ban.entity';
import { ServerRole } from './enums/server-role.enum';

import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { GetMembersQueryDto } from './dto/get-members-query.dto';
import { ChannelsService } from '@/channels/channels.service';
import { ChannelType } from '@/channels/enums/channel-type.enum';
import { MessagesService } from '@/messages/messages.service';
import { MessagesGateway } from '@/messages/messages.gateway';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly channelService: ChannelsService,
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,

    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,

    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,

    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,

    @InjectRepository(ServerBan)
    private readonly serverBanRepository: Repository<ServerBan>,
  ) {}

  private readonly roleHierarchy: Record<ServerRole, number> = {
    [ServerRole.Owner]: 4,
    [ServerRole.Admin]: 3,
    [ServerRole.Moderator]: 2,
    [ServerRole.Member]: 1,
  };

  async isUserBanned(serverId: number, userId: number): Promise<boolean> {
    const ban = await this.serverBanRepository.findOne({
      where: {
        server: { id: serverId },
        user: { id: userId },
      },
    });
    return !!ban;
  }

  private async sendJoinNotification(serverId: number, userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return;

    const server = await this.serverRepository.findOne({
      where: { id: serverId },
      relations: { channels: true },
    });

    if (!server || !server.channels.length) return;

    const defaultChannel = server.channels.find(
      (ch) => ch.type === ChannelType.Text,
    );
    if (!defaultChannel) return;

    const content = `**${user.username}** vient de rejoindre le serveur. Bienvenue !`;
    const systemMessage = await this.messagesService.createSystemMessage(
      defaultChannel.id,
      content,
      userId,
    );

    const roomName = `channel_${defaultChannel.id}`;
    this.messagesGateway.server.to(roomName).emit('newMessage', systemMessage);
  }

  canBanUser(requesterRole: ServerRole, targetRole: ServerRole): boolean {
    if (requesterRole === ServerRole.Owner) {
      return true;
    }
    if (requesterRole === ServerRole.Admin) {
      return (
        targetRole === ServerRole.Moderator || targetRole === ServerRole.Member
      );
    }
    return false;
  }

  async banUser(
    serverId: number,
    requesterId: number,
    targetUserId: number,
    reason?: string,
  ) {
    if (requesterId === targetUserId) {
      throw new BadRequestException('Vous ne pouvez pas vous bannir vous-même');
    }

    const requester = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: requesterId },
      },
    });

    if (!requester) {
      throw new ForbiddenException('Vous ne faites pas partie de ce serveur');
    }

    if (
      requester.role !== ServerRole.Owner &&
      requester.role !== ServerRole.Admin
    ) {
      throw new ForbiddenException(
        'Seuls les owners et admins peuvent bannir des utilisateurs',
      );
    }

    const target = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: targetUserId },
      },
    });

    if (!target) {
      throw new NotFoundException(
        "L'utilisateur cible n'est pas membre de ce serveur",
      );
    }

    if (!this.canBanUser(requester.role, target.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas la permission de bannir cet utilisateur",
      );
    }

    const existingBan = await this.serverBanRepository.findOne({
      where: {
        server: { id: serverId },
        user: { id: targetUserId },
      },
    });

    if (existingBan) {
      throw new BadRequestException('Cet utilisateur est déjà banni');
    }

    const ban = this.serverBanRepository.create({
      server: { id: serverId },
      user: { id: targetUserId },
      bannedBy: { id: requesterId },
      reason: reason || null,
    });

    await this.serverBanRepository.save(ban);

    await this.serverMemberRepository.remove(target);

    return { success: true, message: 'Utilisateur banni avec succès' };
  }

  async unbanUser(serverId: number, requesterId: number, targetUserId: number) {
    const requester = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: requesterId },
      },
    });

    if (!requester) {
      throw new ForbiddenException('Vous ne faites pas partie de ce serveur');
    }

    if (
      requester.role !== ServerRole.Owner &&
      requester.role !== ServerRole.Admin
    ) {
      throw new ForbiddenException(
        'Seuls les owners et admins peuvent débannir des utilisateurs',
      );
    }

    const ban = await this.serverBanRepository.findOne({
      where: {
        server: { id: serverId },
        user: { id: targetUserId },
      },
    });

    if (!ban) {
      throw new NotFoundException("Cet utilisateur n'est pas banni");
    }

    await this.serverBanRepository.remove(ban);

    return { success: true, message: 'Utilisateur débanni avec succès' };
  }

  async getBannedUsers(serverId: number, requesterId: number) {
    const requester = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: requesterId },
      },
    });

    if (!requester) {
      throw new ForbiddenException('Vous ne faites pas partie de ce serveur');
    }

    if (
      requester.role !== ServerRole.Owner &&
      requester.role !== ServerRole.Admin
    ) {
      throw new ForbiddenException(
        'Seuls les owners et admins peuvent voir la liste des bannis',
      );
    }

    const bans = await this.serverBanRepository.find({
      where: { server: { id: serverId } },
      relations: ['user', 'bannedBy'],
      order: { bannedAt: 'DESC' },
    });

    return bans.map((ban) => ({
      id: ban.id,
      user: {
        id: ban.user.id,
        username: ban.user.username,
      },
      bannedBy: ban.bannedBy
        ? {
            id: ban.bannedBy.id,
            username: ban.bannedBy.username,
          }
        : null,
      reason: ban.reason,
      bannedAt: ban.bannedAt,
    }));
  }

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

    await this.channelService.create(
      {
        name: 'general',
        type: ChannelType.Text,
        serverId: server.id,
      },
      userId,
    );

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

  async getMembers(
    serverId: number,
    requesterId: number,
    query: GetMembersQueryDto,
  ) {
    const requesterMembership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: requesterId },
      },
    });

    if (!requesterMembership) {
      throw new ForbiddenException('Vous ne faites pas partie de ce serveur');
    }

    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.serverMemberRepository
      .createQueryBuilder('membership')
      .leftJoinAndSelect('membership.members', 'user')
      .addSelect(
        `CASE
          WHEN membership.role = 'server_owner' THEN 1
          WHEN membership.role = 'server_admin' THEN 2
          WHEN membership.role = 'server_moderator' THEN 3
          ELSE 4
        END`,
        'role_priority',
      )
      .where('membership.serverId = :serverId', { serverId })
      .orderBy('role_priority', 'ASC')
      .addOrderBy('user.username', 'ASC');

    if (search) {
      qb.andWhere('LOWER(user.username) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    const [members, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
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
    const isBanned = await this.isUserBanned(serverId, userId);
    if (isBanned) {
      throw new ForbiddenException('Vous êtes banni de ce serveur');
    }

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

    const savedMember = await this.serverMemberRepository.save(member);

    await this.sendJoinNotification(serverId, userId);

    return savedMember;
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

  async transferOwnership(
    serverId: number,
    requesterId: number,
    newOwnerId: number,
  ) {
    if (requesterId === newOwnerId) {
      throw new BadRequestException('Vous êtes déjà le propriétaire');
    }

    const requester = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: requesterId },
      },
    });

    if (!requester || requester.role !== ServerRole.Owner) {
      throw new ForbiddenException(
        'Seul le propriétaire peut transférer la propriété',
      );
    }

    const newOwner = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: newOwnerId },
      },
    });

    if (!newOwner) {
      throw new NotFoundException('Membre introuvable');
    }

    newOwner.role = ServerRole.Owner;
    requester.role = ServerRole.Admin;

    await this.serverMemberRepository.save([newOwner, requester]);

    return { success: true, message: 'Propriété transférée avec succès' };
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

  private async findValidInvitation(
    code: string,
    relations: string[] = ['server'],
  ) {
    const invitation = await this.invitationRepository.findOne({
      where: { code },
      relations,
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

    return invitation;
  }

  async previewByCode(code: string) {
    const invitation = await this.findValidInvitation(code);

    const memberCount = await this.serverMemberRepository.count({
      where: { server: { id: invitation.server.id } },
    });

    return {
      server: {
        id: invitation.server.id,
        name: invitation.server.name,
        img: invitation.server.img,
        memberCount,
      },
      invitation: {
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
        usesCount: invitation.usesCount,
      },
    };
  }

  async joinByCode(code: string, userId: number) {
    const invitation = await this.findValidInvitation(code);

    const existingMembership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: invitation.serverId },
        members: { id: userId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('Vous êtes déjà membre de ce serveur');
    }

    const isBanned = await this.isUserBanned(invitation.serverId, userId);
    if (isBanned) {
      throw new ForbiddenException('Vous êtes banni de ce serveur');
    }

    const member = this.serverMemberRepository.create({
      server: { id: invitation.serverId },
      members: { id: userId },
      role: ServerRole.Member,
    });

    await this.serverMemberRepository.save(member);

    invitation.usesCount += 1;
    await this.invitationRepository.save(invitation);

    await this.sendJoinNotification(invitation.serverId, userId);

    return {
      message: 'Vous avez rejoint le serveur',
      server: invitation.server,
    };
  }
}
