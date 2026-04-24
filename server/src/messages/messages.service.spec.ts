import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Users } from '../users/entities/users.entity';
import { Reaction } from './entities/reaction.entity';
import { Mention } from './entities/mention.entity';
import { ServerMember } from '../servers/entities/server-member.entity';
import { ChannelType } from '../channels/enums/channel-type.enum';
import { ServerRole } from '../servers/enums/server-role.enum';
import { MessageType } from './enums/message-type.enum';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
  findAndCount: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  manager: {
    transaction: jest.fn(async (cb: (manager: unknown) => Promise<unknown>) =>
      cb({
        create: jest.fn(
          (_entity: unknown, data: Record<string, unknown>) => data,
        ),
        save: jest.fn((x: Record<string, unknown> | unknown[]) =>
          Promise.resolve(Array.isArray(x) ? x : { id: 1, ...x }),
        ),
      }),
    ),
  },
});

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepo: ReturnType<typeof mockRepo>;
  let channelRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let reactionRepo: ReturnType<typeof mockRepo>;
  let memberRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useFactory: mockRepo },
        { provide: getRepositoryToken(Channel), useFactory: mockRepo },
        { provide: getRepositoryToken(Users), useFactory: mockRepo },
        { provide: getRepositoryToken(Reaction), useFactory: mockRepo },
        { provide: getRepositoryToken(ServerMember), useFactory: mockRepo },
        { provide: getRepositoryToken(Mention), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messageRepo = module.get(getRepositoryToken(Message));
    channelRepo = module.get(getRepositoryToken(Channel));
    userRepo = module.get(getRepositoryToken(Users));
    reactionRepo = module.get(getRepositoryToken(Reaction));
    memberRepo = module.get(getRepositoryToken(ServerMember));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = { channelId: 1, content: 'hello', type: MessageType.Text };

    it('lève NotFoundException si channel non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue(undefined);
      await expect(service.create(dto as any, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève NotFoundException si channel est de type Call', async () => {
      channelRepo.findOne.mockResolvedValue({
        id: 1,
        type: ChannelType.Call,
        server: { id: 1 },
      });
      await expect(service.create(dto as any, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève ForbiddenException si user non membre', async () => {
      channelRepo.findOne.mockResolvedValue({
        id: 1,
        type: ChannelType.Text,
        server: { id: 1 },
      });
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.create(dto as any, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lève NotFoundException si user non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue({
        id: 1,
        type: ChannelType.Text,
        server: { id: 1 },
      });
      memberRepo.findOne.mockResolvedValue({ id: 1 });
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(service.create(dto as any, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('crée et retourne le message si tout est valide', async () => {
      const channel = { id: 1, type: ChannelType.Text, server: { id: 1 } };
      const user = { id: 1, username: 'u' };
      const message = { id: 1, content: 'hello' };
      channelRepo.findOne.mockResolvedValue(channel);
      memberRepo.findOne.mockResolvedValue({ id: 1 });
      userRepo.findOneBy.mockResolvedValue(user);
      userRepo.findBy.mockResolvedValue([]);
      messageRepo.create.mockReturnValue(message);
      messageRepo.save.mockResolvedValue(message);
      messageRepo.findOne.mockResolvedValue(message);

      const result = await service.create(dto as any, 1);
      expect(result).toEqual(message);
    });
  });

  describe('createSystemMessage', () => {
    it('lève NotFoundException si channel non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue(undefined);
      await expect(
        service.createSystemMessage(1, 'content', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si user non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue({ id: 1 });
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(
        service.createSystemMessage(1, 'content', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée un message de type System', async () => {
      const channel = { id: 1 };
      const user = { id: 1 };
      const msg = { id: 1, type: MessageType.System };
      channelRepo.findOne.mockResolvedValue(channel);
      userRepo.findOneBy.mockResolvedValue(user);
      messageRepo.create.mockReturnValue(msg);
      messageRepo.save.mockResolvedValue(msg);

      const result = await service.createSystemMessage(1, 'content', 1);
      expect(result).toEqual(msg);
      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: MessageType.System }),
      );
    });
  });

  describe('findAll', () => {
    it('retourne les messages du channel paginés', async () => {
      messageRepo.findAndCount.mockResolvedValue([[{ id: 1 }, { id: 2 }], 2]);
      const result = await service.findAll(1);
      expect(result.messages).toEqual([{ id: 2 }, { id: 1 }]);
      expect(result.total).toBe(2);
      expect(messageRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } }),
      );
    });
  });

  describe('update', () => {
    it('lève NotFoundException si message non trouvé', async () => {
      messageRepo.findOne.mockResolvedValue(undefined);
      await expect(
        service.update(1, { content: 'new' } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it("lève ForbiddenException si l'auteur ne correspond pas", async () => {
      messageRepo.findOne.mockResolvedValue({
        id: 1,
        author: { id: 2 },
        channel: { id: 1 },
      });
      await expect(
        service.update(1, { content: 'new' } as any, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('met à jour le message si auteur valide', async () => {
      const message = {
        id: 1,
        author: { id: 1 },
        channel: { id: 1 },
        content: 'old',
      };
      const updated = { ...message, content: 'new' };
      messageRepo.findOne
        .mockResolvedValueOnce(message)
        .mockResolvedValueOnce(updated);
      messageRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { content: 'new' } as any, 1);
      expect(result).toEqual(updated);
    });
  });

  describe('reaction', () => {
    it('lève NotFoundException si message non trouvé', async () => {
      messageRepo.findOne.mockResolvedValue(undefined);
      await expect(service.reaction(1, '👍', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève NotFoundException si user non trouvé', async () => {
      messageRepo.findOne.mockResolvedValueOnce({ id: 1 });
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(service.reaction(1, '👍', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime la réaction existante (toggle off)', async () => {
      const existingReaction = { id: 1, emoji: '👍' };
      messageRepo.findOne
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 1, reactions: [] });
      userRepo.findOneBy.mockResolvedValue({ id: 1 });
      reactionRepo.findOne.mockResolvedValue(existingReaction);
      reactionRepo.remove.mockResolvedValue(existingReaction);

      await service.reaction(1, '👍', 1);
      expect(reactionRepo.remove).toHaveBeenCalledWith(existingReaction);
    });

    it('crée une nouvelle réaction (toggle on)', async () => {
      const newReaction = { id: 1, emoji: '❤️' };
      messageRepo.findOne
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 1, reactions: [newReaction] });
      userRepo.findOneBy.mockResolvedValue({ id: 1 });
      reactionRepo.findOne.mockResolvedValue(undefined);
      reactionRepo.create.mockReturnValue(newReaction);
      reactionRepo.save.mockResolvedValue(newReaction);

      await service.reaction(1, '❤️', 1);
      expect(reactionRepo.create).toHaveBeenCalled();
      expect(reactionRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('lève NotFoundException si message non trouvé', async () => {
      messageRepo.findOne.mockResolvedValue(undefined);
      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it("supprime si l'utilisateur est l'auteur", async () => {
      const message = {
        id: 1,
        author: { id: 1 },
        channel: { id: 5, server: { id: 2 } },
      };
      messageRepo.findOne.mockResolvedValue(message);
      messageRepo.remove.mockResolvedValue(message);

      const result = await service.remove(1, 1);
      expect(result).toEqual({ success: true, messageId: 1, channelId: 5 });
    });

    it('supprime si user est Admin du serveur', async () => {
      const message = {
        id: 1,
        author: { id: 2 },
        channel: { id: 5, server: { id: 2 } },
      };
      messageRepo.findOne.mockResolvedValue(message);
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Admin });
      messageRepo.remove.mockResolvedValue(message);

      const result = await service.remove(1, 1);
      expect(result).toEqual({ success: true, messageId: 1, channelId: 5 });
    });

    it('lève ForbiddenException si user est simple membre', async () => {
      const message = {
        id: 1,
        author: { id: 2 },
        channel: { id: 5, server: { id: 2 } },
      };
      messageRepo.findOne.mockResolvedValue(message);
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si user non membre', async () => {
      const message = {
        id: 1,
        author: { id: 2 },
        channel: { id: 5, server: { id: 2 } },
      };
      messageRepo.findOne.mockResolvedValue(message);
      memberRepo.findOne.mockResolvedValue(undefined);

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
