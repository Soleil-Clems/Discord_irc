import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '@/users/entities/users.entity';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { jwtConstants } from './constant';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pass, ...result } = user;
    return result;
  }

  generateAccessToken(user: UserDto): string {
    const payload = { ...user };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const token = uuidv4();
    const tokenHash = await bcrypt.hash(token, 10);

    const expiresAt = new Date(
      Date.now() + jwtConstants.refreshTokenExpiresInMs,
    );

    const refreshToken = this.refreshTokenRepository.create({
      tokenHash,
      userId,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return token;
  }

  async login(user: UserDto): Promise<TokenResponseDto> {
    const userEntity = await this.userRepository.findOneBy({ id: user.id });

    if (!userEntity) {
      throw new Error('User not found');
    }

    userEntity.lastSeen = new Date();
    await this.userRepository.save(userEntity);

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 300,
      user: user,
    };
  }

  async refreshTokens(refreshTokenValue: string): Promise<TokenResponseDto> {
    const tokens = await this.refreshTokenRepository.find({
      where: { isRevoked: false },
      relations: ['user'],
    });

    let matchedToken: RefreshToken | null = null;

    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshTokenValue, token.tokenHash);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (matchedToken.expiresAt < new Date()) {
      matchedToken.isRevoked = true;
      await this.refreshTokenRepository.save(matchedToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = matchedToken.user;
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pass, ...userDto } = user;

    const accessToken = this.generateAccessToken(userDto as UserDto);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      expires_in: 300,
      user: userDto as UserDto,
    };
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async logout(
    userId: number,
    refreshTokenValue?: string,
  ): Promise<{ message: string }> {
    if (refreshTokenValue) {
      const tokens = await this.refreshTokenRepository.find({
        where: { userId, isRevoked: false },
      });

      for (const token of tokens) {
        const isMatch = await bcrypt.compare(
          refreshTokenValue,
          token.tokenHash,
        );
        if (isMatch) {
          token.isRevoked = true;
          await this.refreshTokenRepository.save(token);
          return { message: 'Déconnexion réussie' };
        }
      }
    }

    return { message: 'Déconnexion réussie' };
  }

  async logoutAll(userId: number): Promise<{ message: string }> {
    await this.revokeAllUserTokens(userId);
    return { message: 'Déconnexion de tous les appareils réussie' };
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}
