import { IsNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsNumber()
  userId: number;

  @IsString()
  @Length(6, 6)
  code: string;
}
