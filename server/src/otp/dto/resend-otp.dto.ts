import { IsNumber } from 'class-validator';

export class ResendOtpDto {
  @IsNumber()
  userId: number;
}
