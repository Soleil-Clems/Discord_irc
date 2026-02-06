import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Channel } from './entities/channel.entity';
import { Server } from '@/servers/entities/server.entity';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { ServerRole } from '@/servers/enums/server-role.enum';

import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,

    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,

    @InjectRepository(ServerMember)
    private readonly serverMemberRepository: Repository<ServerMember>,
  ) {}

  // helper permission
  private async assertAdminOrOwner(serverId: number, userId: number) {
    const membership = await this.serverMemberRepository.findOne({
      where: {
        server: { id: serverId },
        members: { id: userId },
      },
    });

    if (
      !membership ||
      ![ServerRole.Owner, ServerRole.Admin].includes(membership.role)
    ) {
      throw new ForbiddenException(
        'Seuls les ADMIN ou OWNER peuvent gérer les channels',
      );
    }
  }

  async create(dto: CreateChannelDto, userId: number) {
    const server = await this.serverRepository.findOneBy({
      id: dto.serverId,
    });

    if (!server) {
      throw new NotFoundException('Serveur introuvable');
    }

    await this.assertAdminOrOwner(server.id, userId);

    const channel = this.channelRepository.create({
      name: dto.name,
      type: dto.type,
      server,
    });

    return this.channelRepository.save(channel);
  }

  async findAll(serverId: number) {
    return this.serverRepository.find({
      where: { id: serverId },
      relations: {
        channels: true,
      },
    });
  }

  async findOne(channelId: number) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: {
        server: true,
        messages: {
          author: true,
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel introuvable');
    }

    return channel;
  }

  async update(channelId: number, dto: UpdateChannelDto, userId: number) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: {
        server: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel introuvable');
    }

    await this.assertAdminOrOwner(channel.server.id, userId);

    Object.assign(channel, dto);
    return this.channelRepository.save(channel);
  }

  async remove(channelId: number, userId: number) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: {
        server: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel introuvable');
    }

    await this.assertAdminOrOwner(channel.server.id, userId);

    await this.channelRepository.remove(channel);
    return { success: true };
  }
}
