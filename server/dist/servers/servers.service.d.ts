import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
export declare class ServersService {
    create(createServerDto: CreateServerDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateServerDto: UpdateServerDto): string;
    remove(id: number): string;
}
