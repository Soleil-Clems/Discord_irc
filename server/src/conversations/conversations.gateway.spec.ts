import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationsService } from './conversations.service';
import { Users } from '@/users/entities/users.entity';

const mockConvService = () => ({
  createMessage: jest.fn(),
  getOtherUser: jest.fn(),
  updateMessage: jest.fn(),
  reaction: jest.fn(),
  removeMessage: jest.fn(),
});

const mockJwt = () => ({
  verifyAsync: jest.fn(),
});

const mockUserRepo = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
});

const buildClient = (token: string | undefined, id = 'sock-1') =>
  ({
    id,
    handshake: { auth: { token } },
    join: jest.fn(),
    disconnect: jest.fn(),
    userId: undefined as number | undefined,
  }) as any;

describe('ConversationsGateway', () => {
  let gateway: ConversationsGateway;
  let convService: ReturnType<typeof mockConvService>;
  let jwt: ReturnType<typeof mockJwt>;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let emit: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsGateway,
        { provide: ConversationsService, useFactory: mockConvService },
        { provide: JwtService, useFactory: mockJwt },
        { provide: getRepositoryToken(Users), useFactory: mockUserRepo },
      ],
    }).compile();

    gateway = module.get(ConversationsGateway);
    convService = module.get(ConversationsService);
    jwt = module.get(JwtService);
    userRepo = module.get(getRepositoryToken(Users));

    emit = jest.fn();
    (gateway as any).server = {
      to: jest.fn().mockReturnValue({ emit }),
      emit: jest.fn(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('handleConnection', () => {
    it('disconnect si pas de token', async () => {
      const client = buildClient(undefined);
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnect si token invalide', async () => {
      const client = buildClient('bad');
      jwt.verifyAsync.mockRejectedValue(new Error('bad'));
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('ajoute le socket et émet userOnline sur le premier socket', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      await gateway.handleConnection(client);
      expect(client.join).toHaveBeenCalledWith('user:1');
      expect((gateway as any).server.emit).toHaveBeenCalledWith('userOnline', {
        userId: 1,
      });
    });

    it('n émet pas userOnline sur les sockets suivants', async () => {
      const c1 = buildClient('ok', 's1');
      const c2 = buildClient('ok', 's2');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      await gateway.handleConnection(c1);
      (gateway as any).server.emit.mockClear();
      await gateway.handleConnection(c2);
      expect((gateway as any).server.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('émet userOffline au dernier socket', async () => {
      const client = buildClient('ok', 's1');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      await gateway.handleConnection(client);
      (gateway as any).server.emit.mockClear();

      gateway.handleDisconnect(client);
      expect((gateway as any).server.emit).toHaveBeenCalledWith('userOffline', {
        userId: 1,
      });
    });

    it('ne fait rien si userId absent', () => {
      const client = buildClient('ok', 's1');
      gateway.handleDisconnect(client);
      expect((gateway as any).server.emit).not.toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('getOnlineUsers retourne [] quand aucun user', () => {
      expect(gateway.getOnlineUsers()).toEqual([]);
    });

    it('isUserOnline retourne false quand absent', () => {
      expect(gateway.isUserOnline(1)).toBe(false);
    });

    it('handleGetOnlineUsers retourne la liste', () => {
      const result = gateway.handleGetOnlineUsers({} as any);
      expect(result).toEqual({ onlineUserIds: [] });
    });
  });

  describe('handleGetAllUsersStatus', () => {
    it('retourne tous les users avec leur statut', async () => {
      userRepo.find.mockResolvedValue([
        { id: 1, username: 'a', img: null },
        { id: 2, username: 'b', img: null },
      ]);
      const result = await gateway.handleGetAllUsersStatus();
      expect(result.users).toHaveLength(2);
      expect(result.users[0].isOnline).toBe(false);
    });
  });

  describe('handleSendPrivateMessage', () => {
    it('retourne Unauthorized sans token', async () => {
      const client = buildClient(undefined);
      const result = await gateway.handleSendPrivateMessage(client, {
        conversationId: 1,
        content: 'x',
        type: 'text',
      } as any);
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('crée le message et émet aux deux users', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      const msg = { id: 10 };
      convService.createMessage.mockResolvedValue(msg);
      convService.getOtherUser.mockResolvedValue({ id: 2 });

      const result = await gateway.handleSendPrivateMessage(client, {
        conversationId: 1,
        content: 'hi',
        type: 'text',
      } as any);

      expect(result).toBe(msg);
      expect((gateway as any).server.to).toHaveBeenCalledWith('user:2');
      expect((gateway as any).server.to).toHaveBeenCalledWith('user:1');
      expect(emit).toHaveBeenCalledWith('newPrivateMessage', msg);
    });

    it('retourne une erreur si le service throw', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.createMessage.mockRejectedValue(new Error('boom'));

      const result = await gateway.handleSendPrivateMessage(client, {
        conversationId: 1,
        content: 'x',
      } as any);
      expect(result).toEqual({ error: 'boom' });
    });
  });

  describe('typing indicators', () => {
    it('handleTyping refuse sans token', async () => {
      const client = buildClient(undefined);
      const result = await gateway.handleTyping(client, {
        conversationId: 1,
      } as any);
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('handleTyping émet userTyping', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.getOtherUser.mockResolvedValue({ id: 2 });
      userRepo.findOneBy.mockResolvedValue({ username: 'alice' });

      const result = await gateway.handleTyping(client, {
        conversationId: 1,
      } as any);
      expect(result).toEqual({ success: true });
      expect(emit).toHaveBeenCalledWith(
        'userTyping',
        expect.objectContaining({ userId: 1, username: 'alice' }),
      );
    });

    it('handleTyping retourne une erreur si le service throw', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.getOtherUser.mockRejectedValue(new Error('fail'));
      const result = await gateway.handleTyping(client, {
        conversationId: 1,
      } as any);
      expect(result).toEqual({ error: 'fail' });
    });

    it('handleStopTyping émet userStoppedTyping', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.getOtherUser.mockResolvedValue({ id: 2 });
      userRepo.findOneBy.mockResolvedValue({ username: 'bob' });

      const result = await gateway.handleStopTyping(client, {
        conversationId: 1,
      } as any);
      expect(result).toEqual({ success: true });
      expect(emit).toHaveBeenCalledWith(
        'userStoppedTyping',
        expect.objectContaining({ userId: 1 }),
      );
    });

    it('handleStopTyping sans token', async () => {
      const client = buildClient(undefined);
      const result = await gateway.handleStopTyping(client, {
        conversationId: 1,
      } as any);
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('handleStopTyping gère les erreurs', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.getOtherUser.mockRejectedValue(new Error('fail'));
      const result = await gateway.handleStopTyping(client, {
        conversationId: 1,
      } as any);
      expect(result).toEqual({ error: 'fail' });
    });
  });

  describe('handleUpdatePrivateMessage', () => {
    it('refuse sans token', async () => {
      const client = buildClient(undefined);
      const result = await gateway.handleUpdatePrivateMessage(client, {
        messageId: 1,
        conversationId: 1,
        content: 'x',
      } as any);
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('met à jour et émet à chaque user', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      const updated = { id: 5 };
      convService.updateMessage.mockResolvedValue(updated);
      convService.getOtherUser.mockResolvedValue({ id: 2 });

      const result = await gateway.handleUpdatePrivateMessage(client, {
        messageId: 5,
        conversationId: 1,
        content: 'edited',
      } as any);
      expect(result).toBe(updated);
      expect(emit).toHaveBeenCalledWith('privateMessageUpdated', updated);
    });

    it('retourne l erreur si le service throw', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.updateMessage.mockRejectedValue(new Error('fail'));
      const result = await gateway.handleUpdatePrivateMessage(client, {
        messageId: 5,
        conversationId: 1,
        content: 'e',
      } as any);
      expect(result).toEqual({ error: 'fail' });
    });
  });

  describe('handleAddPrivateReaction', () => {
    it('refuse sans token', async () => {
      const client = buildClient(undefined);
      const result = await gateway.handleAddPrivateReaction(client, {
        messageId: 1,
        emoji: '🔥',
        conversationId: 1,
      });
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('ajoute la réaction et émet', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      const updated = { id: 5 };
      convService.reaction.mockResolvedValue(updated);
      convService.getOtherUser.mockResolvedValue({ id: 2 });

      const result = await gateway.handleAddPrivateReaction(client, {
        messageId: 5,
        emoji: '🔥',
        conversationId: 1,
      });
      expect(result).toBe(updated);
      expect(emit).toHaveBeenCalledWith('privateReactionAdded', updated);
    });

    it('retourne l erreur si reaction throw', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.reaction.mockRejectedValue(new Error('boom'));
      const result = await gateway.handleAddPrivateReaction(client, {
        messageId: 5,
        emoji: '🔥',
        conversationId: 1,
      });
      expect(result).toEqual({ error: 'boom' });
    });
  });

  describe('handleDeletePrivateMessage', () => {
    it('refuse sans token', async () => {
      const client = buildClient(undefined);
      const result = await gateway.handleDeletePrivateMessage(client, {
        messageId: 1,
        conversationId: 1,
      });
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('supprime et émet aux deux users', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.getOtherUser.mockResolvedValue({ id: 2 });
      convService.removeMessage.mockResolvedValue({ ok: true });

      const result = await gateway.handleDeletePrivateMessage(client, {
        messageId: 5,
        conversationId: 1,
      });
      expect(result).toEqual({ ok: true });
      expect(emit).toHaveBeenCalledWith('privateMessageDeleted', {
        messageId: 5,
        conversationId: 1,
      });
    });

    it('retourne l erreur si removeMessage throw', async () => {
      const client = buildClient('ok');
      jwt.verifyAsync.mockResolvedValue({ id: 1 });
      convService.getOtherUser.mockResolvedValue({ id: 2 });
      convService.removeMessage.mockRejectedValue(new Error('fail'));

      const result = await gateway.handleDeletePrivateMessage(client, {
        messageId: 5,
        conversationId: 1,
      });
      expect(result).toEqual({ error: 'fail' });
    });
  });
});
