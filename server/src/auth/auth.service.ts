import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Users } from '@/users/entities/users.entity';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { jwtConstants } from './constant';
import { TokenResponseDto } from './dto/token-response.dto';

const RESET_THROTTLE_MS = 60 * 1000;
const DUMMY_BCRYPT_HASH =
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8ZQ9yDgS9gDQgJj9wT2mVcDqUqU7py';

function hashResetToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private resend: Resend | null = null;
  private mailer: nodemailer.Transporter | null = null;
  private isDev: boolean;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetRepository: Repository<PasswordResetToken>,
  ) {
    this.isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    if (this.isDev) {
      this.mailer = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST'),
        port: Number(this.configService.get<string>('MAIL_PORT')),
        secure: false,
        ignoreTLS: true,
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASS'),
        },
      });
    } else {
      this.resend = new Resend(
        this.configService.get<string>('RESEND_API_KEY'),
      );
    }
  }

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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Temps constant : évite de trahir l'existence d'un compte par la latence
      await bcrypt.compare(email, DUMMY_BCRYPT_HASH);
      return;
    }

    const recent = await this.passwordResetRepository.findOne({
      where: {
        userId: user.id,
        createdAt: MoreThan(new Date(Date.now() - RESET_THROTTLE_MS)),
      },
    });
    if (recent) return; // throttle : pas plus d'un email toutes les RESET_THROTTLE_MS

    await this.passwordResetRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetRepository.save(
      this.passwordResetRepository.create({
        tokenHash,
        userId: user.id,
        expiresAt,
      }),
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not configured');
    }
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await this.sendResetEmail(email, resetLink);
    } catch (err) {
      // On n'expose rien à l'appelant : le controller renvoie toujours le même message générique
      this.logger.error(
        `Failed to send password reset email: ${(err as Error).message}`,
      );
    }
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashResetToken(rawToken);

    const matched = await this.passwordResetRepository.findOne({
      where: { tokenHash, isUsed: false },
    });

    if (!matched) throw new BadRequestException('Lien invalide ou expiré');

    if (matched.expiresAt < new Date()) {
      matched.isUsed = true;
      await this.passwordResetRepository.save(matched);
      throw new BadRequestException('Lien invalide ou expiré');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(
      { id: matched.userId },
      { password: hashed },
    );

    await this.passwordResetRepository.update(
      { userId: matched.userId, isUsed: false },
      { isUsed: true },
    );

    await this.revokeAllUserTokens(matched.userId);
  }

  private async sendResetEmail(email: string, link: string): Promise<void> {
    const html = `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #313338; border-radius: 8px; color: #fff;">
        <h2 style="margin: 0 0 16px; color: #fff;">Réinitialisation du mot de passe</h2>
        <p style="color: #B5BAC1; margin: 0 0 24px;">Clique sur le bouton ci-dessous pour réinitialiser ton mot de passe. Ce lien est valable 1 heure.</p>
        <a href="${link}" style="display: inline-block; background: #5865F2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        <p style="color: #B5BAC1; font-size: 14px; margin: 24px 0 0;">Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
      </div>
    `;

    if (this.isDev && this.mailer) {
      await this.mailer.sendMail({
        from: '"Lezom" <noreply@lezom.com>',
        to: email,
        subject: 'Réinitialisation de ton mot de passe Lezom',
        html,
      });
    } else if (this.resend) {
      const fromEmail =
        this.configService.get<string>('RESEND_FROM_EMAIL') ||
        'onboarding@resend.dev';
      await this.resend.emails.send({
        from: `Lezom <${fromEmail}>`,
        to: email,
        subject: 'Réinitialisation de ton mot de passe Lezom',
        html,
      });
    }
  }
}
