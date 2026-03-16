import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsGateway } from './conversations.gateway';

const mockConversationsService = {
  createOrGet: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findMessages: jest.fn(),
  createMessage: jest.fn(),
  updateMessage: jest.fn(),
  removeMessage: jest.fn(),
};

const mockGateway = {
  server: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
};

const req = { user: { id: 1 } };

describe('ConversationsController', () => {
  let controller: ConversationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        { provide: ConversationsService, useValue: mockConversationsService },
        { provide: ConversationsGateway, useValue: mockGateway },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
    // Reset to chain properly
    mockGateway.server.to.mockReturnThis();
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  it('createOrGet délègue à conversationsService.createOrGet', () => {
    mockConversationsService.createOrGet.mockResolvedValue({ id: 1 });
    controller.createOrGet(req as any, { otherUserId: 2 } as any);
    expect(mockConversationsService.createOrGet).toHaveBeenCalledWith({ otherUserId: 2 }, 1);
  });

  it('findAll délègue à conversationsService.findAll', () => {
    mockConversationsService.findAll.mockResolvedValue([]);
    controller.findAll(req as any);
    expect(mockConversationsService.findAll).toHaveBeenCalledWith(1);
  });

  it('findOne délègue à conversationsService.findOne', () => {
    mockConversationsService.findOne.mockResolvedValue({ id: 1 });
    controller.findOne(req as any, 1);
    expect(mockConversationsService.findOne).toHaveBeenCalledWith(1, 1);
  });

  it('findMessages délègue à conversationsService.findMessages', () => {
    mockConversationsService.findMessages.mockResolvedValue([]);
    controller.findMessages(req as any, 1, '2', '20');
    expect(mockConversationsService.findMessages).toHaveBeenCalledWith(1, 1, 2, 20);
  });

  it('findMessages utilise page/limit par défaut si non fournis', () => {
    mockConversationsService.findMessages.mockResolvedValue([]);
    controller.findMessages(req as any, 1);
    expect(mockConversationsService.findMessages).toHaveBeenCalledWith(1, 1, 1, 50);
  });

  it('createMessage délègue à conversationsService.createMessage', () => {
    mockConversationsService.createMessage.mockResolvedValue({ id: 1 });
    controller.createMessage(req as any, 1, { content: 'hi' } as any);
    expect(mockConversationsService.createMessage).toHaveBeenCalledWith(1, { content: 'hi' }, 1);
  });

  it('updateMessage met à jour et émet via gateway', async () => {
    const updated = {
      id: 1,
      content: 'new',
      conversation: { user1: { id: 1 }, user2: { id: 2 } },
    };
    mockConversationsService.updateMessage.mockResolvedValue(updated);
    const emitMock = jest.fn();
    mockGateway.server.to.mockReturnValue({ to: jest.fn().mockReturnValue({ emit: emitMock }) });

    await controller.updateMessage(req as any, 1, { content: 'new' } as any);
    expect(mockConversationsService.updateMessage).toHaveBeenCalledWith(1, { content: 'new' }, 1);
    expect(emitMock).toHaveBeenCalledWith('privateMessageUpdated', updated);
  });

  it('removeMessage supprime et émet via gateway', async () => {
    const result = { messageId: 1, user1Id: 1, user2Id: 2 };
    mockConversationsService.removeMessage.mockResolvedValue(result);
    const emitMock = jest.fn();
    mockGateway.server.to.mockReturnValue({ to: jest.fn().mockReturnValue({ emit: emitMock }) });

    await controller.removeMessage(req as any, 1);
    expect(mockConversationsService.removeMessage).toHaveBeenCalledWith(1, 1);
    expect(emitMock).toHaveBeenCalledWith('privateMessageDeleted', result.messageId);
  });
});
