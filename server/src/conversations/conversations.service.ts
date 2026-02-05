import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Conversation } from './entities/conversation.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { Users } from '@/users/entities/users.entity';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(PrivateMessage)
    private readonly privateMessageRepository: Repository<PrivateMessage>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async createOrGet(
    createConversationDto: CreateConversationDto,
    currentUserId: number,
  ) {
    const { userId: otherUserId } = createConversationDto;

    if (currentUserId === otherUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas créer une conversation avec vous-même',
      );
    }

    const currentUser = await this.userRepository.findOneBy({
      id: currentUserId,
    });
    const otherUser = await this.userRepository.findOneBy({ id: otherUserId });

    if (!currentUser || !otherUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const [user1, user2] =
      currentUserId < otherUserId
        ? [currentUser, otherUser]
        : [otherUser, currentUser];

    let conversation = await this.conversationRepository.findOne({
      where: {
        user1: { id: user1.id },
        user2: { id: user2.id },
      },
      relations: { user1: true, user2: true },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        user1,
        user2,
      });
      conversation = await this.conversationRepository.save(conversation);
      conversation = await this.conversationRepository.findOne({
        where: { id: conversation.id },
        relations: { user1: true, user2: true },
      });
    }

    return conversation;
  }

  async findAll(userId: number) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.user1', 'user1')
      .leftJoinAndSelect('conversation.user2', 'user2')
      .where('user1.id = :userId', { userId })
      .orWhere('user2.id = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    return conversations;
  }

  async findOne(conversationId: number, userId: number) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: { user1: true, user2: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    if (conversation.user1.id !== userId && conversation.user2.id !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return conversation;
  }

  async findMessages(
    conversationId: number,
    userId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const conversation = await this.findOne(conversationId, userId);

    const [messages, total] = await this.privateMessageRepository.findAndCount({
      where: { conversation: { id: conversation.id } },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createMessage(
    conversationId: number,
    createMessageDto: CreatePrivateMessageDto,
    senderId: number,
  ) {
    const conversation = await this.findOne(conversationId, senderId);

    const sender = await this.userRepository.findOneBy({ id: senderId });

    if (!sender) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const message = this.privateMessageRepository.create({
      content: createMessageDto.content,
      type: createMessageDto.type,
      sender,
      conversation,
    });

    const savedMessage = await this.privateMessageRepository.save(message);

    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    return this.privateMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: { sender: true, conversation: { user1: true, user2: true } },
    });
  }

  async updateMessage(
    messageId: number,
    updateMessageDto: UpdatePrivateMessageDto,
    userId: number,
  ) {
    const message = await this.privateMessageRepository.findOne({
      where: { id: messageId },
      relations: { sender: true, conversation: { user1: true, user2: true } },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.sender.id !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier ce message');
    }

    Object.assign(message, updateMessageDto);
    return this.privateMessageRepository.save(message);
  }

  async removeMessage(messageId: number, userId: number) {
    const message = await this.privateMessageRepository.findOne({
      where: { id: messageId },
      relations: { sender: true, conversation: { user1: true, user2: true } },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.sender.id !== userId) {
      throw new ForbiddenException('Suppression non autorisée');
    }

    const conversationId = message.conversation.id;
    const user1Id = message.conversation.user1.id;
    const user2Id = message.conversation.user2.id;

    await this.privateMessageRepository.remove(message);
    return { success: true, messageId, conversationId, user1Id, user2Id };
  }

  async getOtherUser(conversationId: number, userId: number): Promise<Users> {
    const conversation = await this.findOne(conversationId, userId);
    return conversation.user1.id === userId
      ? conversation.user2
      : conversation.user1;
  }
}
