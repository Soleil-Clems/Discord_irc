import { AuthService } from './auth.service';
import { UserDto } from 'src/users/dto/user.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): {
        access_token: string;
        user: UserDto;
    };
    logout(): {
        message: string;
    };
    getProfile(req: any): any;
}
