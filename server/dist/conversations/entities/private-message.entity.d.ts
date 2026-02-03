import { Users } from '@/users/entities/users.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from '@/messages/enums/message-type.enum';
export declare class PrivateMessage {
    id: number;
    content: string;
    type: MessageType;
    sender: Users;
    conversation: Conversation;
    createdAt: Date;
    updatedAt: Date;
}
