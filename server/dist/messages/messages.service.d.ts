import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Channel } from '@/channels/entities/channel.entity';
import { Users } from '@/users/entities/users.entity';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
export declare class MessagesService {
    private readonly messageRepository;
    private readonly channelRepository;
    private readonly userRepository;
    private readonly serverMemberRepository;
    constructor(messageRepository: Repository<Message>, channelRepository: Repository<Channel>, userRepository: Repository<Users>, serverMemberRepository: Repository<ServerMember>);
    create(createMessageDto: CreateMessageDto, userId: number): Promise<Message>;
    findAll(channelId: number): Promise<Message[]>;
    update(messageId: number, updateMessageDto: UpdateMessageDto, userId: number): Promise<Message>;
    remove(messageId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
