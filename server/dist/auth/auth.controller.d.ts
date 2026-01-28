import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): {
        access_token: string;
    };
    logout(req: any): Promise<{
        message: string;
    }>;
    getProfile(req: any): any;
}
