import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { BlockedUser } from './entities/blocked-user.entity';
import { Users } from '@/users/entities/users.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(BlockedUser)
    private blockedUserRepository: Repository<BlockedUser>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async sendRequest(senderId: number, receiverId: number): Promise<FriendRequest> {
    if (senderId === receiverId) {
      throw new BadRequestException('Vous ne pouvez pas vous ajouter vous-même');
    }

    const receiver = await this.usersRepository.findOne({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('Utilisateur non trouvé');

    // Vérifier si bloqué
    const isBlocked = await this.blockedUserRepository.findOne({
      where: [
        { blocker: { id: senderId }, blocked: { id: receiverId } },
        { blocker: { id: receiverId }, blocked: { id: senderId } },
      ],
    });
    if (isBlocked) throw new ForbiddenException('Impossible d\'envoyer une demande à cet utilisateur');

    // Vérifier si déjà amis ou demande existante
    const existing = await this.friendRequestRepository.findOne({
      where: [
        { sender: { id: senderId }, receiver: { id: receiverId } },
        { sender: { id: receiverId }, receiver: { id: senderId } },
      ],
    });
    if (existing) {
      if (existing.status === FriendRequestStatus.Accepted) {
        throw new ConflictException('Vous êtes déjà amis');
      }
      throw new ConflictException('Une demande est déjà en cours');
    }

    const request = this.friendRequestRepository.create({
      sender: { id: senderId },
      receiver: { id: receiverId },
    });

    return this.friendRequestRepository.save(request);
  }

  async acceptRequest(requestId: number, userId: number): Promise<FriendRequest> {
    const request = await this.friendRequestRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver'],
    });

    if (!request) throw new NotFoundException('Demande non trouvée');
    if (request.receiver.id !== userId) throw new ForbiddenException('Action non autorisée');
    if (request.status !== FriendRequestStatus.Pending) {
      throw new ConflictException('Cette demande a déjà été traitée');
    }

    request.status = FriendRequestStatus.Accepted;
    return this.friendRequestRepository.save(request);
  }

  async declineRequest(requestId: number, userId: number): Promise<{ message: string }> {
    const request = await this.friendRequestRepository.findOne({
      where: { id: requestId },
      relations: ['sender', 'receiver'],
    });

    if (!request) throw new NotFoundException('Demande non trouvée');
    if (request.receiver.id !== userId) throw new ForbiddenException('Action non autorisée');

    const senderId = request.sender.id;

    await this.friendRequestRepository.remove(request);

    // Bloquer l'expéditeur
    const alreadyBlocked = await this.blockedUserRepository.findOne({
      where: { blocker: { id: userId }, blocked: { id: senderId } },
    });

    if (!alreadyBlocked) {
      const block = this.blockedUserRepository.create({
        blocker: { id: userId },
        blocked: { id: senderId },
      });
      await this.blockedUserRepository.save(block);
    }

    return { message: 'Demande refusée' };
  }

  async removeFriend(userId: number, friendId: number): Promise<{ message: string }> {
    const friendship = await this.friendRequestRepository.findOne({
      where: [
        { sender: { id: userId }, receiver: { id: friendId }, status: FriendRequestStatus.Accepted },
        { sender: { id: friendId }, receiver: { id: userId }, status: FriendRequestStatus.Accepted },
      ],
    });

    if (!friendship) throw new NotFoundException('Ami non trouvé');

    await this.friendRequestRepository.remove(friendship);
    return { message: 'Ami supprimé' };
  }

  async getFriends(userId: number): Promise<Users[]> {
    const requests = await this.friendRequestRepository.find({
      where: [
        { sender: { id: userId }, status: FriendRequestStatus.Accepted },
        { receiver: { id: userId }, status: FriendRequestStatus.Accepted },
      ],
      relations: ['sender', 'receiver'],
    });

    return requests.map((r) =>
      r.sender.id === userId ? r.receiver : r.sender,
    );
  }

  async getPendingRequests(userId: number): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: { receiver: { id: userId }, status: FriendRequestStatus.Pending },
      relations: ['sender'],
    });
  }

  async getSentRequests(userId: number): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: { sender: { id: userId }, status: FriendRequestStatus.Pending },
      relations: ['receiver'],
    });
  }

  async blockUser(blockerId: number, blockedId: number): Promise<{ message: string }> {
    if (blockerId === blockedId) {
      throw new BadRequestException('Action invalide');
    }

    const alreadyBlocked = await this.blockedUserRepository.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
    });
    if (alreadyBlocked) throw new ConflictException('Utilisateur déjà bloqué');

    // Supprimer toute relation d'amitié existante
    const friendship = await this.friendRequestRepository.findOne({
      where: [
        { sender: { id: blockerId }, receiver: { id: blockedId } },
        { sender: { id: blockedId }, receiver: { id: blockerId } },
      ],
    });
    if (friendship) await this.friendRequestRepository.remove(friendship);

    const block = this.blockedUserRepository.create({
      blocker: { id: blockerId },
      blocked: { id: blockedId },
    });
    await this.blockedUserRepository.save(block);

    return { message: 'Utilisateur bloqué' };
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<{ message: string }> {
    const block = await this.blockedUserRepository.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
    });

    if (!block) throw new NotFoundException('Utilisateur non bloqué');

    await this.blockedUserRepository.remove(block);
    return { message: 'Utilisateur débloqué' };
  }

  async getBlockedUsers(userId: number): Promise<Users[]> {
    const blocks = await this.blockedUserRepository.find({
      where: { blocker: { id: userId } },
      relations: ['blocked'],
    });

    return blocks.map((b) => b.blocked);
  }
}
