import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreatePrivateMessageDto } from './dto/create-private-message.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    createOrGet(req: any, dto: CreateConversationDto): Promise<import("./entities/conversation.entity").Conversation | null>;
    findAll(req: any): Promise<import("./entities/conversation.entity").Conversation[]>;
    findOne(req: any, id: number): Promise<import("./entities/conversation.entity").Conversation>;
    findMessages(req: any, id: number, page?: string, limit?: string): Promise<{
        messages: import("./entities/private-message.entity").PrivateMessage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createMessage(req: any, id: number, dto: CreatePrivateMessageDto): Promise<import("./entities/private-message.entity").PrivateMessage | null>;
    updateMessage(req: any, id: number, dto: UpdatePrivateMessageDto): Promise<import("./entities/private-message.entity").PrivateMessage>;
    removeMessage(req: any, id: number): Promise<{
        success: boolean;
    }>;
}
