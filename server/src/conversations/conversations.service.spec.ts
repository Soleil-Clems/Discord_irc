import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationsService } from './conversations.service';
import { Conversation } from './entities/conversation.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { PrivateReaction } from './entities/private-reaction.entity';
import { Users } from '../users/entities/users.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
});

const user1 = { id: 1, username: 'user1' };
const user2 = { id: 2, username: 'user2' };

describe('ConversationsService', () => {
  let service: ConversationsService;
  let convRepo: ReturnType<typeof mockRepo>;
  let msgRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let reactionRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: getRepositoryToken(Conversation), useFactory: mockRepo },
        { provide: getRepositoryToken(PrivateMessage), useFactory: mockRepo },
        { provide: getRepositoryToken(Users), useFactory: mockRepo },
        { provide: getRepositoryToken(PrivateReaction), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    convRepo = module.get(getRepositoryToken(Conversation));
    msgRepo = module.get(getRepositoryToken(PrivateMessage));
    userRepo = module.get(getRepositoryToken(Users));
    reactionRepo = module.get(getRepositoryToken(PrivateReaction));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createOrGet', () => {
    it('lève BadRequestException si même utilisateur', async () => {
      await expect(service.createOrGet({ userId: 1 }, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lève NotFoundException si un utilisateur non trouvé', async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(undefined);
      await expect(service.createOrGet({ userId: 2 }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retourne la conversation existante', async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);
      const existing = { id: 1, user1, user2 };
      convRepo.findOne.mockResolvedValue(existing);

      const result = await service.createOrGet({ userId: 2 }, 1);
      expect(result).toEqual(existing);
    });

    it('crée une nouvelle conversation si absente', async () => {
      userRepo.findOneBy
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);
      const newConv = { id: 1, user1, user2 };
      convRepo.findOne
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(newConv);
      convRepo.create.mockReturnValue(newConv);
      convRepo.save.mockResolvedValue(newConv);

      const result = await service.createOrGet({ userId: 2 }, 1);
      expect(result).toEqual(newConv);
    });
  });

  describe('findAll', () => {
    it('retourne les conversations via queryBuilder', async () => {
      const conversations = [{ id: 1, user1, user2 }];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([conversations, 1]),
      };
      convRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(1);
      expect(result.conversations).toEqual(conversations);
      expect(result.total).toEqual(1);
    });
  });

  describe('findOne', () => {
    it('lève NotFoundException si conversation non trouvée', async () => {
      convRepo.findOne.mockResolvedValue(undefined);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si user non participant', async () => {
      convRepo.findOne.mockResolvedValue({
        id: 1,
        user1: { id: 3 },
        user2: { id: 4 },
      });
      await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('retourne la conversation si user est user1', async () => {
      const conv = { id: 1, user1, user2 };
      convRepo.findOne.mockResolvedValue(conv);
      const result = await service.findOne(1, 1);
      expect(result).toEqual(conv);
    });

    it('retourne la conversation si user est user2', async () => {
      const conv = { id: 1, user1, user2 };
      convRepo.findOne.mockResolvedValue(conv);
      const result = await service.findOne(1, 2);
      expect(result).toEqual(conv);
    });
  });

  describe('findMessages', () => {
    it('lève NotFoundException si conversation non trouvée', async () => {
      convRepo.findOne.mockResolvedValue(undefined);
      await expect(service.findMessages(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retourne les messages paginés inversés', async () => {
      const conv = { id: 1, user1, user2 };
      const messages = [{ id: 2 }, { id: 1 }];
      convRepo.findOne.mockResolvedValue(conv);
      msgRepo.findAndCount.mockResolvedValue([messages, 2]);

      const result = await service.findMessages(1, 1, 1, 50);
      expect(result.total).toBe(2);
      expect(result.messages).toEqual(messages.reverse());
    });
  });

  describe('createMessage', () => {
    it('lève NotFoundException si sender non trouvé', async () => {
      convRepo.findOne.mockResolvedValue({ id: 1, user1, user2 });
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(
        service.createMessage(1, { content: 'hi' } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée et retourne le message', async () => {
      const conv = { id: 1, user1, user2, updatedAt: new Date() };
      const sender = { id: 1 };
      const msg = { id: 1, content: 'hi' };
      convRepo.findOne.mockResolvedValue(conv);
      userRepo.findOneBy.mockResolvedValue(sender);
      msgRepo.create.mockReturnValue(msg);
      msgRepo.save.mockResolvedValue(msg);
      msgRepo.findOne.mockResolvedValue({ ...msg, sender, conversation: conv });
      convRepo.save.mockResolvedValue(conv);

      const result = await service.createMessage(
        1,
        { content: 'hi' } as any,
        1,
      );
      expect(result).toHaveProperty('content', 'hi');
    });
  });

  describe('updateMessage', () => {
    it('lève NotFoundException si message non trouvé', async () => {
      msgRepo.findOne.mockResolvedValue(undefined);
      await expect(
        service.updateMessage(1, { content: 'new' } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si non expéditeur', async () => {
      msgRepo.findOne.mockResolvedValue({
        id: 1,
        sender: { id: 2 },
        conversation: { user1, user2 },
      });
      await expect(
        service.updateMessage(1, { content: 'new' } as any, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('met à jour et retourne le message', async () => {
      const msg = {
        id: 1,
        content: 'old',
        sender: { id: 1 },
        conversation: { user1, user2 },
      };
      msgRepo.findOne.mockResolvedValue(msg);
      msgRepo.save.mockResolvedValue({ ...msg, content: 'new' });

      const result = await service.updateMessage(
        1,
        { content: 'new' } as any,
        1,
      );
      expect(result.content).toBe('new');
    });
  });

  describe('removeMessage', () => {
    it('lève NotFoundException si message non trouvé', async () => {
      msgRepo.findOne.mockResolvedValue(undefined);
      await expect(service.removeMessage(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève ForbiddenException si non expéditeur', async () => {
      msgRepo.findOne.mockResolvedValue({
        id: 1,
        sender: { id: 2 },
        conversation: { id: 1, user1, user2 },
      });
      await expect(service.removeMessage(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('supprime et retourne les infos', async () => {
      const msg = {
        id: 1,
        sender: { id: 1 },
        conversation: { id: 5, user1, user2 },
      };
      msgRepo.findOne.mockResolvedValue(msg);
      msgRepo.remove.mockResolvedValue(msg);

      const result = await service.removeMessage(1, 1);
      expect(result).toEqual({
        success: true,
        messageId: 1,
        conversationId: 5,
        user1Id: 1,
        user2Id: 2,
      });
    });
  });

  describe('reaction', () => {
    it('lève NotFoundException si message non trouvé', async () => {
      msgRepo.findOne.mockResolvedValue(undefined);
      await expect(service.reaction(1, '👍', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève NotFoundException si user non trouvé', async () => {
      msgRepo.findOne.mockResolvedValueOnce({
        id: 1,
        conversation: { user1, user2 },
      });
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(service.reaction(1, '👍', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime la réaction existante (toggle off)', async () => {
      const msg = { id: 1, conversation: { user1, user2 } };
      msgRepo.findOne.mockResolvedValue(msg);
      userRepo.findOneBy.mockResolvedValue(user1);
      const existing = { id: 1 };
      reactionRepo.findOne.mockResolvedValue(existing);
      reactionRepo.remove.mockResolvedValue(existing);

      await service.reaction(1, '👍', 1);
      expect(reactionRepo.remove).toHaveBeenCalledWith(existing);
    });

    it('crée la réaction si absente (toggle on)', async () => {
      const msg = { id: 1, conversation: { user1, user2 } };
      msgRepo.findOne.mockResolvedValue(msg);
      userRepo.findOneBy.mockResolvedValue(user1);
      reactionRepo.findOne.mockResolvedValue(undefined);
      reactionRepo.create.mockReturnValue({});
      reactionRepo.save.mockResolvedValue({});

      await service.reaction(1, '❤️', 1);
      expect(reactionRepo.save).toHaveBeenCalled();
    });
  });

  describe('getOtherUser', () => {
    it('retourne user2 si userId est user1', async () => {
      convRepo.findOne.mockResolvedValue({ id: 1, user1, user2 });
      const result = await service.getOtherUser(1, 1);
      expect(result).toEqual(user2);
    });

    it('retourne user1 si userId est user2', async () => {
      convRepo.findOne.mockResolvedValue({ id: 1, user1, user2 });
      const result = await service.getOtherUser(1, 2);
      expect(result).toEqual(user1);
    });
  });
});
