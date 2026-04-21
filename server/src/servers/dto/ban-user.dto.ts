import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class BanUserDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationHours?: number;
}
