import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MessageType } from '@/messages/enums/message-type.enum';

export class SendPrivateMessageDto {
  @IsNumber()
  conversationId: number;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;
}
