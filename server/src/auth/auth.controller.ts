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
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalAuthGuard } from './guards/local.auth.guard';
import { AuthService } from './auth.service';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LogoutDto } from './dto/logout.dto';
import { jwtConstants } from './constant';
import { UsersService } from '@/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user: UserDto = req.user;

    const tokens = await this.authService.login(user);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: jwtConstants.refreshTokenExpiresInMs,
    });

    return {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      user: tokens.user,
    };
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

    return {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      user: tokens.user,
    };
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
