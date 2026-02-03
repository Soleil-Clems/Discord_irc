import { IsEnum, IsString } from 'class-validator';
import { MessageType } from '@/messages/enums/message-type.enum';

export class CreatePrivateMessageDto {
  @IsString()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;
}
