import { UsersService } from '../users/users.service';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { Users } from '@/users/entities/users.entity';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenResponseDto } from './dto/token-response.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private userRepository;
    private refreshTokenRepository;
    constructor(usersService: UsersService, jwtService: JwtService, userRepository: Repository<Users>, refreshTokenRepository: Repository<RefreshToken>);
    validateUser(email: string, password: string): Promise<UserDto | null>;
    generateAccessToken(user: UserDto): string;
    generateRefreshToken(userId: number): Promise<string>;
    login(user: UserDto): Promise<TokenResponseDto>;
    refreshTokens(refreshTokenValue: string): Promise<TokenResponseDto>;
    revokeAllUserTokens(userId: number): Promise<void>;
    logout(userId: number, refreshTokenValue?: string): Promise<{
        message: string;
    }>;
    logoutAll(userId: number): Promise<{
        message: string;
    }>;
    cleanupExpiredTokens(): Promise<number>;
}
