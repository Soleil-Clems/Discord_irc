import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServersService } from './servers.service';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { Invitation } from './entities/invitation.entity';
import { ServerBan } from './entities/server-ban.entity';
import { Users } from '../users/entities/users.entity';
import { ServerRole } from './enums/server-role.enum';
import { ChannelsService } from '../channels/channels.service';
import { MessagesService } from '../messages/messages.service';
import { MessagesGateway } from '../messages/messages.gateway';

const mockRepo = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
});

const mockChannelService = { create: jest.fn() };
const mockMessagesService = { createSystemMessage: jest.fn() };
const mockMessagesGateway = {
  server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
};

describe('ServersService', () => {
  let service: ServersService;
  let userRepo: ReturnType<typeof mockRepo>;
  let serverRepo: ReturnType<typeof mockRepo>;
  let memberRepo: ReturnType<typeof mockRepo>;
  let invitationRepo: ReturnType<typeof mockRepo>;
  let banRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersService,
        { provide: getRepositoryToken(Users), useFactory: mockRepo },
        { provide: getRepositoryToken(Server), useFactory: mockRepo },
        { provide: getRepositoryToken(ServerMember), useFactory: mockRepo },
        { provide: getRepositoryToken(Invitation), useFactory: mockRepo },
        { provide: getRepositoryToken(ServerBan), useFactory: mockRepo },
        { provide: ChannelsService, useValue: mockChannelService },
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
      ],
    }).compile();

    service = module.get<ServersService>(ServersService);
    userRepo = module.get(getRepositoryToken(Users));
    serverRepo = module.get(getRepositoryToken(Server));
    memberRepo = module.get(getRepositoryToken(ServerMember));
    invitationRepo = module.get(getRepositoryToken(Invitation));
    banRepo = module.get(getRepositoryToken(ServerBan));
  });

  afterEach(() => jest.clearAllMocks());

  describe('canBanUser', () => {
    it('Owner peut bannir tout le monde', () => {
      expect(service.canBanUser(ServerRole.Owner, ServerRole.Admin)).toBe(true);
      expect(service.canBanUser(ServerRole.Owner, ServerRole.Member)).toBe(true);
      expect(service.canBanUser(ServerRole.Owner, ServerRole.Moderator)).toBe(true);
    });

    it('Admin peut bannir Moderator et Member', () => {
      expect(service.canBanUser(ServerRole.Admin, ServerRole.Moderator)).toBe(true);
      expect(service.canBanUser(ServerRole.Admin, ServerRole.Member)).toBe(true);
    });

    it('Admin ne peut pas bannir Owner ou Admin', () => {
      expect(service.canBanUser(ServerRole.Admin, ServerRole.Owner)).toBe(false);
      expect(service.canBanUser(ServerRole.Admin, ServerRole.Admin)).toBe(false);
    });

    it('Member ne peut bannir personne', () => {
      expect(service.canBanUser(ServerRole.Member, ServerRole.Member)).toBe(false);
    });
  });

  describe('isUserBanned', () => {
    it('retourne true si banni', async () => {
      banRepo.findOne.mockResolvedValue({ id: 1 });
      const result = await service.isUserBanned(1, 1);
      expect(result).toBe(true);
    });

    it('retourne false si non banni', async () => {
      banRepo.findOne.mockResolvedValue(undefined);
      const result = await service.isUserBanned(1, 1);
      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('lève NotFoundException si user non trouvé', async () => {
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(service.create({ name: 'Test' }, 1)).rejects.toThrow(NotFoundException);
    });

    it('crée serveur, membership Owner et channel general', async () => {
      const user = { id: 1, username: 'user' };
      const server = { id: 1, name: 'Test' };
      userRepo.findOneBy.mockResolvedValue(user);
      serverRepo.create.mockReturnValue(server);
      serverRepo.save.mockResolvedValue(server);
      memberRepo.create.mockReturnValue({});
      memberRepo.save.mockResolvedValue({});
      mockChannelService.create.mockResolvedValue({});

      const result = await service.create({ name: 'Test' }, 1);
      expect(result).toEqual(server);
      expect(memberRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: ServerRole.Owner }));
      expect(mockChannelService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retourne les serveurs des memberships', async () => {
      const server = { id: 1, name: 'Test' };
      memberRepo.find.mockResolvedValue([{ server }]);
      const result = await service.findAll(1);
      expect(result).toEqual([server]);
    });
  });

  describe('findOne', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si serveur non trouvé', async () => {
      memberRepo.findOne.mockResolvedValue({ id: 1 });
      serverRepo.findOne.mockResolvedValue(undefined);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('retourne le serveur si membre', async () => {
      const server = { id: 1, channels: [], memberships: [] };
      memberRepo.findOne.mockResolvedValue({ id: 1 });
      serverRepo.findOne.mockResolvedValue(server);
      const result = await service.findOne(1, 1);
      expect(result).toEqual(server);
    });
  });

  describe('getMembers', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getMembers(1, 1, {})).rejects.toThrow(ForbiddenException);
    });

    it('retourne les membres avec pagination', async () => {
      memberRepo.findOne.mockResolvedValue({ id: 1 });
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };
      memberRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMembers(1, 1, { page: 1, limit: 20 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('update', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.update(1, { name: 'new', img: '' } as any, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si non Owner', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Admin, server: { id: 1 } });
      await expect(service.update(1, { name: 'new', img: '' } as any, 1)).rejects.toThrow(ForbiddenException);
    });

    it('met à jour le serveur si Owner', async () => {
      const server = { id: 1, name: 'old' };
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner, server });
      serverRepo.save.mockResolvedValue({ ...server, name: 'new' });

      const result = await service.update(1, { name: 'new', img: '' } as any, 1);
      expect(result).toHaveProperty('name', 'new');
    });
  });

  describe('remove', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si non Owner', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Admin, server: { id: 1 } });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('supprime le serveur si Owner', async () => {
      const server = { id: 1 };
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner, server });
      serverRepo.remove.mockResolvedValue(server);

      const result = await service.remove(1, 1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('joinServer', () => {
    it('lève ForbiddenException si banni', async () => {
      banRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.joinServer(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si déjà membre', async () => {
      banRepo.findOne.mockResolvedValue(undefined);
      memberRepo.findOne.mockResolvedValueOnce({ id: 1 });
      await expect(service.joinServer(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('crée le membership et envoie la notification', async () => {
      banRepo.findOne.mockResolvedValue(undefined);
      memberRepo.findOne.mockResolvedValueOnce(undefined);
      const newMember = { id: 1, role: ServerRole.Member };
      memberRepo.create.mockReturnValue(newMember);
      memberRepo.save.mockResolvedValue(newMember);
      // sendJoinNotification - user non trouvé, donc s'arrête proprement
      userRepo.findOneBy.mockResolvedValue(undefined);

      const result = await service.joinServer(1, 1);
      expect(result).toEqual(newMember);
      expect(memberRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: ServerRole.Member }));
    });
  });

  describe('changeMemberRole', () => {
    it('lève ForbiddenException si requester non Owner', async () => {
      memberRepo.findOne.mockResolvedValueOnce({ role: ServerRole.Admin });
      await expect(service.changeMemberRole(1, 1, 2, ServerRole.Moderator)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si target non trouvé', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Owner })
        .mockResolvedValueOnce(undefined);
      await expect(service.changeMemberRole(1, 1, 2, ServerRole.Moderator)).rejects.toThrow(NotFoundException);
    });

    it('change le rôle du membre', async () => {
      const target = { id: 2, role: ServerRole.Member };
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Owner })
        .mockResolvedValueOnce(target);
      memberRepo.save.mockResolvedValue({ ...target, role: ServerRole.Moderator });

      const result = await service.changeMemberRole(1, 1, 2, ServerRole.Moderator);
      expect(result.role).toBe(ServerRole.Moderator);
    });
  });

  describe('transferOwnership', () => {
    it('lève BadRequestException si requesterId === newOwnerId', async () => {
      await expect(service.transferOwnership(1, 1, 1)).rejects.toThrow(BadRequestException);
    });

    it('lève ForbiddenException si requester non Owner', async () => {
      memberRepo.findOne.mockResolvedValueOnce({ role: ServerRole.Admin });
      await expect(service.transferOwnership(1, 1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si newOwner non trouvé', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Owner })
        .mockResolvedValueOnce(undefined);
      await expect(service.transferOwnership(1, 1, 2)).rejects.toThrow(NotFoundException);
    });

    it('transfère la propriété avec succès', async () => {
      const requester = { id: 1, role: ServerRole.Owner };
      const newOwner = { id: 2, role: ServerRole.Member };
      memberRepo.findOne
        .mockResolvedValueOnce(requester)
        .mockResolvedValueOnce(newOwner);
      memberRepo.save.mockResolvedValue([]);

      const result = await service.transferOwnership(1, 1, 2);
      expect(result.success).toBe(true);
      expect(newOwner.role).toBe(ServerRole.Owner);
      expect(requester.role).toBe(ServerRole.Admin);
    });
  });

  describe('leaveServer', () => {
    it('lève NotFoundException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.leaveServer(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si Owner sans newOwnerId', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      await expect(service.leaveServer(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si newOwner invalide', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Owner })
        .mockResolvedValueOnce(undefined);
      await expect(service.leaveServer(1, 1, 2)).rejects.toThrow(NotFoundException);
    });

    it("Owner transfère la propriété puis quitte", async () => {
      const membership = { id: 1, role: ServerRole.Owner };
      const newOwner = { id: 2, role: ServerRole.Member };
      memberRepo.findOne
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(newOwner);
      memberRepo.save.mockResolvedValue(newOwner);
      memberRepo.remove.mockResolvedValue(membership);

      const result = await service.leaveServer(1, 1, 2);
      expect(result.success).toBe(true);
    });

    it('non-Owner quitte directement', async () => {
      const membership = { id: 1, role: ServerRole.Member };
      memberRepo.findOne.mockResolvedValue(membership);
      memberRepo.remove.mockResolvedValue(membership);

      const result = await service.leaveServer(1, 1);
      expect(result.success).toBe(true);
    });
  });

  describe('createInvitation', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.createInvitation(1, 1, {})).rejects.toThrow(ForbiddenException);
    });

    it('crée une invitation', async () => {
      memberRepo.findOne.mockResolvedValue({ id: 1 });
      invitationRepo.save.mockImplementation((inv) => Promise.resolve({ ...inv, id: 1, createdAt: new Date() }));

      const result = await service.createInvitation(1, 1, { maxUses: 10 });
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('maxUses', 10);
    });
  });

  describe('getServerInvitations', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getServerInvitations(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si rôle insuffisant', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });
      await expect(service.getServerInvitations(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('retourne les invitations pour Admin/Owner', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Admin });
      invitationRepo.find.mockResolvedValue([{ id: 1 }]);
      const result = await service.getServerInvitations(1, 1);
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('deleteInvitation', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.deleteInvitation(1, 1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si rôle insuffisant', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });
      await expect(service.deleteInvitation(1, 1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si invitation non trouvée', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      invitationRepo.findOne.mockResolvedValue(undefined);
      await expect(service.deleteInvitation(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('supprime et retourne { success: true }', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      const invitation = { id: 1 };
      invitationRepo.findOne.mockResolvedValue(invitation);
      invitationRepo.remove.mockResolvedValue(invitation);

      const result = await service.deleteInvitation(1, 1, 1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('banUser', () => {
    it('lève BadRequestException si self-ban', async () => {
      await expect(service.banUser(1, 1, 1)).rejects.toThrow(BadRequestException);
    });

    it('lève ForbiddenException si requester non membre', async () => {
      memberRepo.findOne.mockResolvedValueOnce(undefined);
      await expect(service.banUser(1, 1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si requester est Member', async () => {
      memberRepo.findOne.mockResolvedValueOnce({ role: ServerRole.Member });
      await expect(service.banUser(1, 1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si target non membre', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Admin })
        .mockResolvedValueOnce(undefined);
      await expect(service.banUser(1, 1, 2)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si permissions insuffisantes (Admin vs Admin)', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Admin })
        .mockResolvedValueOnce({ role: ServerRole.Admin });
      await expect(service.banUser(1, 1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève BadRequestException si déjà banni', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Owner })
        .mockResolvedValueOnce({ role: ServerRole.Member });
      banRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.banUser(1, 1, 2)).rejects.toThrow(BadRequestException);
    });

    it('bannit avec succès', async () => {
      memberRepo.findOne
        .mockResolvedValueOnce({ role: ServerRole.Owner })
        .mockResolvedValueOnce({ role: ServerRole.Member });
      banRepo.findOne.mockResolvedValue(undefined);
      banRepo.create.mockReturnValue({});
      banRepo.save.mockResolvedValue({});
      memberRepo.remove.mockResolvedValue({});

      const result = await service.banUser(1, 1, 2, 'spam');
      expect(result.success).toBe(true);
    });
  });

  describe('unbanUser', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.unbanUser(1, 1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si rôle insuffisant', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });
      await expect(service.unbanUser(1, 1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si non banni', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      banRepo.findOne.mockResolvedValue(undefined);
      await expect(service.unbanUser(1, 1, 2)).rejects.toThrow(NotFoundException);
    });

    it('déban avec succès', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      const ban = { id: 1 };
      banRepo.findOne.mockResolvedValue(ban);
      banRepo.remove.mockResolvedValue(ban);

      const result = await service.unbanUser(1, 1, 2);
      expect(result.success).toBe(true);
    });
  });

  describe('getBannedUsers', () => {
    it('lève ForbiddenException si non membre', async () => {
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getBannedUsers(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('retourne la liste des bannis mappée', async () => {
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      banRepo.find.mockResolvedValue([
        { id: 1, user: { id: 2, username: 'banned' }, bannedBy: { id: 1, username: 'owner' }, reason: 'spam', bannedAt: new Date() },
      ]);

      const result = await service.getBannedUsers(1, 1);
      expect(result[0]).toHaveProperty('user');
      expect(result[0]).toHaveProperty('bannedBy');
    });
  });
});
