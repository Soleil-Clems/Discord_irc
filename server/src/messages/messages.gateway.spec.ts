import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

const mockMessagesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  reaction: jest.fn(),
  remove: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
};

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    // Mock the WebSocket server
    (gateway as any).server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(gateway).toBeDefined());

  describe('create (handleCreateMessage)', () => {
    it('crée le message et émet newMessage', async () => {
      const msg = { id: 1, content: 'hi', channel: { id: 5 } };
      mockMessagesService.create.mockResolvedValue(msg);
      const client = { data: { user: { id: 1 } }, join: jest.fn() };
      const emitMock = jest.fn();
      (gateway as any).server.to.mockReturnValue({ emit: emitMock });

      await gateway.create({ id: 1 } as any, client as any, { channelId: 5, content: 'hi' } as any);
      expect(mockMessagesService.create).toHaveBeenCalled();
      expect(emitMock).toHaveBeenCalledWith('newMessage', msg);
    });
  });

  describe('findAll (joinChannel)', () => {
    it('rejoint la room et retourne les messages', async () => {
      const msgs = [{ id: 1 }];
      mockMessagesService.findAll.mockResolvedValue(msgs);
      const rooms = new Set(['channel_99']);
      const client = {
        data: { user: { id: 1 } },
        join: jest.fn(),
        leave: jest.fn(),
        rooms,
      };

      const result = await gateway.findAll({ id: 1 } as any, client as any, 5);
      expect(client.join).toHaveBeenCalledWith('channel_5');
      expect(result).toEqual(msgs);
    });
  });

  describe('update (handleUpdateMessage)', () => {
    it('met à jour le message et émet messageUpdated', async () => {
      const updated = { id: 1, content: 'new', channel: { id: 5 } };
      mockMessagesService.update.mockResolvedValue(updated);
      const emitMock = jest.fn();
      (gateway as any).server.to.mockReturnValue({ emit: emitMock });
      const client = { data: { user: { id: 1 } } };

      await gateway.update({ messageId: 1, content: 'new' } as any, client as any);
      expect(emitMock).toHaveBeenCalledWith('messageUpdated', updated);
    });
  });

  describe('remove (handleDeleteMessage)', () => {
    it('supprime le message et émet messageDeleted', async () => {
      const removed = { success: true, messageId: 1, channelId: 5 };
      mockMessagesService.remove.mockResolvedValue(removed);
      const emitMock = jest.fn();
      (gateway as any).server.to.mockReturnValue({ emit: emitMock });
      const user = { id: 1 };
      const data = { messageId: 1, channelId: 5 };

      await gateway.remove(user as any, data as any);
      expect(mockMessagesService.remove).toHaveBeenCalledWith(1, 1);
      expect(emitMock).toHaveBeenCalledWith('messageDeleted', { messageId: 1 });
    });
  });
});
