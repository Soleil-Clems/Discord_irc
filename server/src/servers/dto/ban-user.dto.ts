import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BanUserDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
