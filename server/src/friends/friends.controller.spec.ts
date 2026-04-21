import { Test, TestingModule } from '@nestjs/testing';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

const mockFriendsService = {
  sendRequest: jest.fn(),
  acceptRequest: jest.fn(),
  declineRequest: jest.fn(),
  getFriends: jest.fn(),
  getPendingRequests: jest.fn(),
  getSentRequests: jest.fn(),
  removeFriend: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
  getBlockedUsers: jest.fn(),
};

const req = { user: { id: 1 } };

describe('FriendsController', () => {
  let controller: FriendsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [{ provide: FriendsService, useValue: mockFriendsService }],
    }).compile();

    controller = module.get<FriendsController>(FriendsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  it('sendRequest délègue à friendsService.sendRequest', () => {
    mockFriendsService.sendRequest.mockResolvedValue({});
    controller.sendRequest(req as any, 2);
    expect(mockFriendsService.sendRequest).toHaveBeenCalledWith(1, 2);
  });

  it('acceptRequest délègue à friendsService.acceptRequest', () => {
    mockFriendsService.acceptRequest.mockResolvedValue({});
    controller.acceptRequest(req as any, 5);
    expect(mockFriendsService.acceptRequest).toHaveBeenCalledWith(5, 1);
  });

  it('declineRequest délègue à friendsService.declineRequest', () => {
    mockFriendsService.declineRequest.mockResolvedValue({});
    controller.declineRequest(req as any, 5);
    expect(mockFriendsService.declineRequest).toHaveBeenCalledWith(5, 1);
  });

  it('getFriends délègue à friendsService.getFriends', () => {
    mockFriendsService.getFriends.mockResolvedValue([]);
    controller.getFriends(req as any);
    expect(mockFriendsService.getFriends).toHaveBeenCalledWith(1);
  });

  it('getPendingRequests délègue à friendsService.getPendingRequests', () => {
    mockFriendsService.getPendingRequests.mockResolvedValue([]);
    controller.getPendingRequests(req as any);
    expect(mockFriendsService.getPendingRequests).toHaveBeenCalledWith(1);
  });

  it('getSentRequests délègue à friendsService.getSentRequests', () => {
    mockFriendsService.getSentRequests.mockResolvedValue([]);
    controller.getSentRequests(req as any);
    expect(mockFriendsService.getSentRequests).toHaveBeenCalledWith(1);
  });

  it('removeFriend délègue à friendsService.removeFriend', () => {
    mockFriendsService.removeFriend.mockResolvedValue({});
    controller.removeFriend(req as any, 2);
    expect(mockFriendsService.removeFriend).toHaveBeenCalledWith(1, 2);
  });

  it('blockUser délègue à friendsService.blockUser', () => {
    mockFriendsService.blockUser.mockResolvedValue({});
    controller.blockUser(req as any, 2);
    expect(mockFriendsService.blockUser).toHaveBeenCalledWith(1, 2);
  });

  it('unblockUser délègue à friendsService.unblockUser', () => {
    mockFriendsService.unblockUser.mockResolvedValue({});
    controller.unblockUser(req as any, 2);
    expect(mockFriendsService.unblockUser).toHaveBeenCalledWith(1, 2);
  });

  it('getBlockedUsers délègue à friendsService.getBlockedUsers', () => {
    mockFriendsService.getBlockedUsers.mockResolvedValue([]);
    controller.getBlockedUsers(req as any);
    expect(mockFriendsService.getBlockedUsers).toHaveBeenCalledWith(1);
  });
});
