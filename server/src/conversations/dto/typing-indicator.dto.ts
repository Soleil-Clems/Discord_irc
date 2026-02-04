import { IsNumber } from 'class-validator';

export class TypingIndicatorDto {
  @IsNumber()
  conversationId: number;
}
