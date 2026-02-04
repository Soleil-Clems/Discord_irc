import { IsNumber } from 'class-validator';

export class CreateConversationDto {
  @IsNumber()
  userId: number;
}
