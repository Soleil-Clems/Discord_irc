import { UserDto } from '@/users/dto/user.dto';

export class TokenResponseDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: UserDto;
}
