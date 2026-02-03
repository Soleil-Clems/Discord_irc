import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { Server } from '@/servers/entities/server.entity';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
export declare class ChannelsService {
    private readonly channelRepository;
    private readonly serverRepository;
    private readonly serverMemberRepository;
    constructor(channelRepository: Repository<Channel>, serverRepository: Repository<Server>, serverMemberRepository: Repository<ServerMember>);
    private assertAdminOrOwner;
    create(dto: CreateChannelDto, userId: number): Promise<Channel>;
    findAll(serverId: number): Promise<Server[]>;
    findOne(channelId: number): Promise<Channel>;
    update(channelId: number, dto: UpdateChannelDto, userId: number): Promise<Channel>;
    remove(channelId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
