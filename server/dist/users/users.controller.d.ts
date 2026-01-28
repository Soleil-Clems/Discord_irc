import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailParamDto } from './dto/email-param.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/users.entity").Users>;
    findByEmail(params: EmailParamDto): Promise<import("./entities/users.entity").Users>;
    findAll(): Promise<import("./entities/users.entity").Users[]>;
    findOne(id: number): Promise<import("./entities/users.entity").Users>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<import("./entities/users.entity").Users> | undefined;
    remove(id: string): Promise<{
        message: string;
        error: boolean;
    }>;
}
