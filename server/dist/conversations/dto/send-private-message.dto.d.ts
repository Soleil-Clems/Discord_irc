import { MessageType } from '@/messages/enums/message-type.enum';
export declare class SendPrivateMessageDto {
    conversationId: number;
    content: string;
    type: MessageType;
}
