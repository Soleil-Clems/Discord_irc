import { Users } from './users.entity';
import { Repository } from 'typeorm';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<Users>);
    findAll(): string;
    findOne(id: number): string;
    remove(id: number): string;
}
