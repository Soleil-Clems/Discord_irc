import { MessageType } from '../enums/message-type.enum';
export declare class CreateMessageDto {
    content: string;
    type: MessageType;
    channelId: number;
}
