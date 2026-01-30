import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MessageType } from '../enums/message-type.enum';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsNumber()
  channelId: number;
}
