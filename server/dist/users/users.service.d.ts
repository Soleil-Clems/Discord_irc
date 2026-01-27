import { Users } from './users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<Users>);
    create(createUserDto: CreateUserDto): CreateUserDto;
    findAll(): string;
    findOne(id: number): string;
    remove(id: number): string;
}
