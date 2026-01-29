import { IsEnum, IsNumber } from 'class-validator';
import { ServerRole } from '../enums/server-role.enum';

export class ChangeRoleDto {
  @IsNumber()
  memberId: number;

  @IsEnum(ServerRole)
  role: ServerRole;
}
