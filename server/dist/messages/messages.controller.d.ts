import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    create(req: any, dto: CreateMessageDto): Promise<import("./entities/message.entity").Message>;
    findAll(channelId: number): Promise<import("./entities/message.entity").Message[]>;
    update(req: any, id: number, dto: UpdateMessageDto): Promise<import("./entities/message.entity").Message>;
    remove(req: any, id: number): Promise<{
        success: boolean;
    }>;
}
