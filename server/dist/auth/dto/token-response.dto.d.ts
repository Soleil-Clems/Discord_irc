import { UserDto } from '@/users/dto/user.dto';
export declare class TokenResponseDto {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user?: UserDto;
}
