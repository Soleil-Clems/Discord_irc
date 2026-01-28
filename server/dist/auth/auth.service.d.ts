import { UsersService } from '../users/users.service';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { Users } from '@/users/entities/users.entity';
import { Repository } from 'typeorm';
export declare class AuthService {
    private usersService;
    private jwtService;
    private userRepository;
    constructor(usersService: UsersService, jwtService: JwtService, userRepository: Repository<Users>);
    validateUser(email: string, password: string): Promise<UserDto | null>;
    login(user: UserDto): Promise<{
        access_token: string;
        user: UserDto;
    }>;
}
