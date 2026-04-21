import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';

const mockMessagesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockGateway = {
  server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
};

describe('MessagesController', () => {
  let controller: MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  describe('create', () => {
    it('délègue à messagesService.create', async () => {
      const dto = { channelId: 1, content: 'hello' } as any;
      const req = { user: { id: 1 } };
      mockMessagesService.create.mockResolvedValue({ id: 1, content: 'hello' });
      await controller.create(req as any, dto);
      expect(mockMessagesService.create).toHaveBeenCalledWith(dto, 1);
    });
  });

  describe('findAll', () => {
    it('délègue à messagesService.findAll', async () => {
      mockMessagesService.findAll.mockResolvedValue([]);
      await controller.findAll(1);
      expect(mockMessagesService.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('met à jour et émet via gateway', async () => {
      const updated = { id: 1, content: 'new', channel: { id: 5 } };
      mockMessagesService.update.mockResolvedValue(updated);
      const req = { user: { id: 1 } };
      const emitMock = jest.fn();
      mockGateway.server.to.mockReturnValue({ emit: emitMock });

      await controller.update(req as any, 1, { content: 'new' } as any);
      expect(mockMessagesService.update).toHaveBeenCalledWith(1, { content: 'new' }, 1);
      expect(mockGateway.server.to).toHaveBeenCalledWith('channel_5');
      expect(emitMock).toHaveBeenCalledWith('messageUpdated', updated);
    });
  });

  describe('remove', () => {
    it('supprime et émet via gateway', async () => {
      const removed = { success: true, messageId: 1, channelId: 5 };
      mockMessagesService.remove.mockResolvedValue(removed);
      const req = { user: { id: 1 } };
      const emitMock = jest.fn();
      mockGateway.server.to.mockReturnValue({ emit: emitMock });

      await controller.remove(req as any, 1);
      expect(mockMessagesService.remove).toHaveBeenCalledWith(1, 1);
      expect(mockGateway.server.to).toHaveBeenCalledWith('channel_5');
      expect(emitMock).toHaveBeenCalledWith('messageDeleted', removed.messageId);
    });
  });
});
