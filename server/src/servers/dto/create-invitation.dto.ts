import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxUses?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(604800)
  expiresIn?: number;
}
