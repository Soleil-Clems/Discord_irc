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

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,

    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

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

  async findAll(channelId: number) {
    return this.messageRepository.find({
      where: { channel: { id: channelId } },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
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
      },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable');
    }

    if (message.author.id !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier ce message');
    }

    Object.assign(message, updateMessageDto);
    return this.messageRepository.save(message);
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

    if (message.author.id === userId) {
      await this.messageRepository.remove(message);
      return { success: true };
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
    return { success: true };
  }
}
