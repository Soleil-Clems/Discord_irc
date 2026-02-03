import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { Users } from '@/users/entities/users.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';
export declare class ConversationsService {
    private readonly conversationRepository;
    private readonly privateMessageRepository;
    private readonly userRepository;
    constructor(conversationRepository: Repository<Conversation>, privateMessageRepository: Repository<PrivateMessage>, userRepository: Repository<Users>);
    createOrGet(createConversationDto: CreateConversationDto, currentUserId: number): Promise<Conversation | null>;
    findAll(userId: number): Promise<Conversation[]>;
    findOne(conversationId: number, userId: number): Promise<Conversation>;
    findMessages(conversationId: number, userId: number, page?: number, limit?: number): Promise<{
        messages: PrivateMessage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createMessage(conversationId: number, createMessageDto: CreatePrivateMessageDto, senderId: number): Promise<PrivateMessage | null>;
    updateMessage(messageId: number, updateMessageDto: UpdatePrivateMessageDto, userId: number): Promise<PrivateMessage>;
    removeMessage(messageId: number, userId: number): Promise<{
        success: boolean;
    }>;
    getOtherUser(conversationId: number, userId: number): Promise<Users>;
}
