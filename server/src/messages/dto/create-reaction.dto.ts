import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateReactionDto {
  @IsString()
  emoji: string;

  @IsNumber()
  channelId: number;

  @IsNumber()
  messageId: number;
}
