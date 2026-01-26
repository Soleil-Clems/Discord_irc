import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): string;
    findOne(id: string): string;
    remove(id: string): string;
}
