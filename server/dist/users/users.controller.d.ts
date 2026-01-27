import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): CreateUserDto;
    findAll(): string;
    findOne(id: string): string;
    remove(id: string): string;
}
