import {
  Controller,
  Request,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Body,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalAuthGuard } from './guards/local.auth.guard';
import { AuthService } from './auth.service';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LogoutDto } from './dto/logout.dto';
import { jwtConstants } from './constant';
import { UsersService } from '@/users/users.service';
import { OtpService } from '@/otp/otp.service';
import { VerifyOtpDto } from '@/otp/dto/verify-otp.dto';
import { ResendOtpDto } from '@/otp/dto/resend-otp.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private otpService: OtpService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: jwtConstants.refreshTokenExpiresInMs,
    });
  }

  private buildTokenResponse(tokens: TokenResponseDto) {
    return {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      user: tokens.user,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user: UserDto = req.user;

    if (user.isTwoFactorEnabled) {
      await this.otpService.generateOtp(user.id, user.email);
      return {
        requiresTwoFactor: true,
        userId: user.id,
      };
    }

    const tokens = await this.authService.login(user);
    this.setRefreshTokenCookie(res, tokens.refresh_token);
    return this.buildTokenResponse(tokens);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isValid = await this.otpService.verifyOtp(
      verifyOtpDto.userId,
      verifyOtpDto.code,
    );

    if (!isValid) {
      throw new UnauthorizedException('Code invalide ou expiré');
    }

    const user = await this.userService.findOne(verifyOtpDto.userId);
    const tokens = await this.authService.login(user as UserDto);

    this.setRefreshTokenCookie(res, tokens.refresh_token);
    return this.buildTokenResponse(tokens);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    const user = await this.userService.findOne(resendOtpDto.userId);
    const sent = await this.otpService.generateOtp(user.id, user.email);
    if (!sent) {
      return { message: 'Un code a déjà été envoyé récemment' };
    }
    return { message: 'Code envoyé' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string = req.cookies?.refresh_token;

    if (!refreshToken) {
      return { message: 'Refresh token manquant', statusCode: 401 };
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    return this.buildTokenResponse(tokens);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req,
    @Body() logoutDto: LogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId: number = req.user.id;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string =
      logoutDto.refresh_token || req.cookies?.refresh_token;

    res.clearCookie('refresh_token');

    return this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  logoutAll(@Request() req, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId: number = req.user.id;

    res.clearCookie('refresh_token');

    return this.authService.logoutAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.userService.findOne(req.user.id);
  }
}
