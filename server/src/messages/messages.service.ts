import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Message } from './entities/message.entity';
import { Channel } from '@/channels/entities/channel.entity';
import { Users } from '@/users/entities/users.entity';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { ServerRole } from '@/servers/enums/server-role.enum';

import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ChannelType } from '@/channels/enums/channel-type.enum';
import { MessageType } from './enums/message-type.enum';
import { Reaction } from './entities/reaction.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,

    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
  ) {}

  async create(createMessageDto: CreateMessageDto, userId: number) {
    const channel = await this.channelRepository.findOne({
      where: { id: createMessageDto.channelId },
      relations: { server: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel introuvable');
    }

    if (channel.type !== ChannelType.Text) {
      throw new NotFoundException(
        "Impossible d'envoyer des messages dans un channel call.",
      );
    }

    const member = await this.serverMemberRepository.findOne({
      where: {
        server: { id: channel.server.id },
        members: { id: userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Accès refusé');
    }

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const message = this.messageRepository.create({
      content: createMessageDto.content,
      type: createMessageDto.type,
      author: user,
      channel: channel,
    });

    return this.messageRepository.save(message);
  }

  async createSystemMessage(
    channelId: number,
    content: string,
    userId: number,
  ) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel introuvable');
    }

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const message = this.messageRepository.create({
      content,

      type: MessageType.System,
      author: user,
      channel: channel,
    });

    return this.messageRepository.save(message);
  }

  async findAll(channelId: number, page: number = 1, limit: number = 50) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { channel: { id: channelId } },
      relations: { author: true, reactions: { author: true } },
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

  async update(
    messageId: number,
    updateMessageDto: UpdateMessageDto,
    userId: number,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        author: true,
        channel: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.author.id !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier ce message');
    }

    Object.assign(message, updateMessageDto);
    await this.messageRepository.save(message);

    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: { author: true, channel: true },
    });
  }

  async reaction(messageId: number, emoji: string, userId: number) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const existingReaction = await this.reactionRepository.findOne({
      where: {
        message: { id: messageId },
        author: { id: userId },
        emoji,
      },
    });

    if (existingReaction) {
      await this.reactionRepository.remove(existingReaction);
    } else {
      const reaction = this.reactionRepository.create({
        emoji,
        author: user,
        message,
      });
      await this.reactionRepository.save(reaction);
    }

    return this.messageRepository.findOne({
      where: { id: messageId },
      relations: { author: true, channel: true, reactions: { author: true } },
    });
  }

  async remove(messageId: number, userId: number) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        author: true,
        channel: {
          server: true,
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    const channelId = message.channel.id;

    if (message.author.id === userId) {
      await this.messageRepository.remove(message);
      return { success: true, messageId, channelId };
    }

    const member = await this.serverMemberRepository.findOne({
      where: {
        server: { id: message.channel.server.id },
        members: { id: userId },
      },
    });

    if (
      !member ||
      (member.role !== ServerRole.Owner && member.role !== ServerRole.Admin)
    ) {
      throw new ForbiddenException('Suppression non autorisée');
    }

    await this.messageRepository.remove(message);
    return { success: true, messageId, channelId };
  }
}
