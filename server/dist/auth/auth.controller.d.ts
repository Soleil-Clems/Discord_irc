import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UserDto } from 'src/users/dto/user.dto';
import { LogoutDto } from './dto/logout.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any, res: Response): Promise<{
        access_token: string;
        expires_in: number;
        user: UserDto | undefined;
    }>;
    refresh(req: any, res: Response): Promise<{
        message: string;
        statusCode: number;
        access_token?: undefined;
        expires_in?: undefined;
        user?: undefined;
    } | {
        access_token: string;
        expires_in: number;
        user: UserDto | undefined;
        message?: undefined;
        statusCode?: undefined;
    }>;
    logout(req: any, logoutDto: LogoutDto, res: Response): Promise<{
        message: string;
    }>;
    logoutAll(req: any, res: Response): Promise<{
        message: string;
    }>;
    getProfile(req: any): any;
}
