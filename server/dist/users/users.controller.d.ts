import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailParamDto } from './dto/email-param.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./users.entity").Users>;
    findByEmail(params: EmailParamDto): Promise<import("./users.entity").Users>;
    findAll(): Promise<import("./users.entity").Users[]>;
    findOne(id: number): Promise<import("./users.entity").Users>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<import("./users.entity").Users> | undefined;
    remove(id: string): Promise<{
        message: string;
        error: boolean;
    }>;
}
