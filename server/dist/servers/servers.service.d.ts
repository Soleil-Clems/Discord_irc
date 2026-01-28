import { CreateServerDto } from './dto/create-server.dto';
import { Users } from '@/users/entities/users.entity';
import { Repository } from 'typeorm';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
export declare class ServersService {
    private userRepository;
    private serverRepository;
    private serverMemberRepository;
    constructor(userRepository: Repository<Users>, serverRepository: Repository<Server>, serverMemberRepository: Repository<ServerMember>);
    create(createServerDto: CreateServerDto, userId: number): Promise<Server>;
    findAll(): Promise<Server[]>;
    findOne(id: number): Promise<Server>;
    remove(id: number): string;
}
