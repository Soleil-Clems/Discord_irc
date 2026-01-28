import { UsersService } from '../users/users.service';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<UserDto | null>;
    login(user: UserDto): {
        access_token: string;
        user: UserDto;
    };
}
