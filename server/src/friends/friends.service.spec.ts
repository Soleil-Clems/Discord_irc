import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FriendsService } from './friends.service';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { BlockedUser } from './entities/blocked-user.entity';
import { Users } from '../users/entities/users.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
});

describe('FriendsService', () => {
  let service: FriendsService;
  let friendRequestRepo: ReturnType<typeof mockRepo>;
  let blockedUserRepo: ReturnType<typeof mockRepo>;
  let usersRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: getRepositoryToken(FriendRequest), useFactory: mockRepo },
        { provide: getRepositoryToken(BlockedUser), useFactory: mockRepo },
        { provide: getRepositoryToken(Users), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
    friendRequestRepo = module.get(getRepositoryToken(FriendRequest));
    blockedUserRepo = module.get(getRepositoryToken(BlockedUser));
    usersRepo = module.get(getRepositoryToken(Users));
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendRequest', () => {
    it('lève BadRequestException si senderId === receiverId', async () => {
      await expect(service.sendRequest(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('lève NotFoundException si receiver non trouvé', async () => {
      usersRepo.findOne.mockResolvedValue(undefined);
      await expect(service.sendRequest(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si un blocage existe', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      blockedUserRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.sendRequest(1, 2)).rejects.toThrow(ForbiddenException);
    });

    it('lève ConflictException si déjà amis', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      friendRequestRepo.findOne.mockResolvedValue({ status: FriendRequestStatus.Accepted });
      await expect(service.sendRequest(1, 2)).rejects.toThrow(ConflictException);
    });

    it('lève ConflictException si demande déjà en cours', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      friendRequestRepo.findOne.mockResolvedValue({ status: FriendRequestStatus.Pending });
      await expect(service.sendRequest(1, 2)).rejects.toThrow(ConflictException);
    });

    it('crée et retourne la demande si tout est valide', async () => {
      const request = { id: 1, sender: { id: 1 }, receiver: { id: 2 } };
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      friendRequestRepo.findOne.mockResolvedValue(undefined);
      friendRequestRepo.create.mockReturnValue(request);
      friendRequestRepo.save.mockResolvedValue(request);

      const result = await service.sendRequest(1, 2);
      expect(result).toEqual(request);
    });
  });

  describe('acceptRequest', () => {
    it('lève NotFoundException si demande non trouvée', async () => {
      friendRequestRepo.findOne.mockResolvedValue(undefined);
      await expect(service.acceptRequest(1, 1)).rejects.toThrow(NotFoundException);
    });

    it("lève ForbiddenException si l'utilisateur n'est pas le receiver", async () => {
      friendRequestRepo.findOne.mockResolvedValue({ id: 1, receiver: { id: 2 }, status: FriendRequestStatus.Pending });
      await expect(service.acceptRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ConflictException si demande déjà traitée', async () => {
      friendRequestRepo.findOne.mockResolvedValue({ id: 1, receiver: { id: 1 }, status: FriendRequestStatus.Accepted });
      await expect(service.acceptRequest(1, 1)).rejects.toThrow(ConflictException);
    });

    it('accepte la demande et retourne la requête mise à jour', async () => {
      const request = { id: 1, receiver: { id: 1 }, status: FriendRequestStatus.Pending };
      friendRequestRepo.findOne.mockResolvedValue(request);
      friendRequestRepo.save.mockResolvedValue({ ...request, status: FriendRequestStatus.Accepted });

      const result = await service.acceptRequest(1, 1);
      expect(result.status).toBe(FriendRequestStatus.Accepted);
    });
  });

  describe('declineRequest', () => {
    it('lève NotFoundException si demande non trouvée', async () => {
      friendRequestRepo.findOne.mockResolvedValue(undefined);
      await expect(service.declineRequest(1, 1)).rejects.toThrow(NotFoundException);
    });

    it("lève ForbiddenException si l'utilisateur n'est pas le receiver", async () => {
      friendRequestRepo.findOne.mockResolvedValue({ id: 1, receiver: { id: 2 }, sender: { id: 3 } });
      await expect(service.declineRequest(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('refuse, bloque et retourne message', async () => {
      const request = { id: 1, receiver: { id: 1 }, sender: { id: 2 } };
      friendRequestRepo.findOne.mockResolvedValue(request);
      friendRequestRepo.remove.mockResolvedValue(request);
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      blockedUserRepo.create.mockReturnValue({});
      blockedUserRepo.save.mockResolvedValue({});

      const result = await service.declineRequest(1, 1);
      expect(result.message).toBe('Demande refusée');
      expect(blockedUserRepo.save).toHaveBeenCalled();
    });

    it("ne recrée pas le blocage s'il existe déjà", async () => {
      const request = { id: 1, receiver: { id: 1 }, sender: { id: 2 } };
      friendRequestRepo.findOne.mockResolvedValue(request);
      friendRequestRepo.remove.mockResolvedValue(request);
      blockedUserRepo.findOne.mockResolvedValue({ id: 1 });

      await service.declineRequest(1, 1);
      expect(blockedUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('removeFriend', () => {
    it('lève NotFoundException si amitié non trouvée', async () => {
      friendRequestRepo.findOne.mockResolvedValue(undefined);
      await expect(service.removeFriend(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('supprime et retourne le message', async () => {
      const friendship = { id: 1 };
      friendRequestRepo.findOne.mockResolvedValue(friendship);
      friendRequestRepo.remove.mockResolvedValue(friendship);

      const result = await service.removeFriend(1, 2);
      expect(result.message).toBe('Ami supprimé');
    });
  });

  describe('getFriends', () => {
    it('retourne les amis en mappant sender/receiver', async () => {
      const user1 = { id: 1, username: 'user1' };
      const user2 = { id: 2, username: 'user2' };
      friendRequestRepo.find.mockResolvedValue([
        { sender: user1, receiver: user2, status: FriendRequestStatus.Accepted },
        { sender: user2, receiver: user1, status: FriendRequestStatus.Accepted },
      ]);

      const result = await service.getFriends(1);
      expect(result).toContainEqual(user2);
      expect(result).toContainEqual(user2);
    });
  });

  describe('getPendingRequests', () => {
    it('retourne les demandes en attente reçues', async () => {
      const requests = [{ id: 1 }];
      friendRequestRepo.find.mockResolvedValue(requests);
      const result = await service.getPendingRequests(1);
      expect(result).toEqual(requests);
    });
  });

  describe('getSentRequests', () => {
    it('retourne les demandes envoyées', async () => {
      const requests = [{ id: 1 }];
      friendRequestRepo.find.mockResolvedValue(requests);
      const result = await service.getSentRequests(1);
      expect(result).toEqual(requests);
    });
  });

  describe('blockUser', () => {
    it('lève BadRequestException si blockerId === blockedId', async () => {
      await expect(service.blockUser(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('lève ConflictException si déjà bloqué', async () => {
      blockedUserRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.blockUser(1, 2)).rejects.toThrow(ConflictException);
    });

    it('supprime amitié existante puis bloque', async () => {
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      const friendship = { id: 1 };
      friendRequestRepo.findOne.mockResolvedValue(friendship);
      friendRequestRepo.remove.mockResolvedValue(friendship);
      blockedUserRepo.create.mockReturnValue({});
      blockedUserRepo.save.mockResolvedValue({});

      const result = await service.blockUser(1, 2);
      expect(result.message).toBe('Utilisateur bloqué');
      expect(friendRequestRepo.remove).toHaveBeenCalled();
    });

    it('bloque sans supprimer si pas amis', async () => {
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      friendRequestRepo.findOne.mockResolvedValue(undefined);
      blockedUserRepo.create.mockReturnValue({});
      blockedUserRepo.save.mockResolvedValue({});

      const result = await service.blockUser(1, 2);
      expect(result.message).toBe('Utilisateur bloqué');
      expect(friendRequestRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('unblockUser', () => {
    it('lève NotFoundException si blocage non trouvé', async () => {
      blockedUserRepo.findOne.mockResolvedValue(undefined);
      await expect(service.unblockUser(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('débloque et retourne message', async () => {
      const block = { id: 1 };
      blockedUserRepo.findOne.mockResolvedValue(block);
      blockedUserRepo.remove.mockResolvedValue(block);

      const result = await service.unblockUser(1, 2);
      expect(result.message).toBe('Utilisateur débloqué');
    });
  });

  describe('getBlockedUsers', () => {
    it('retourne la liste des utilisateurs bloqués', async () => {
      const blocked1 = { id: 2, username: 'blocked' };
      blockedUserRepo.find.mockResolvedValue([{ blocked: blocked1 }]);
      const result = await service.getBlockedUsers(1);
      expect(result).toEqual([blocked1]);
    });
  });
});
