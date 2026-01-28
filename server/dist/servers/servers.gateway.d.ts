import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
export declare class ServersGateway {
    private readonly serversService;
    constructor(serversService: ServersService);
    create(createServerDto: CreateServerDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(updateServerDto: UpdateServerDto): string;
    remove(id: number): string;
}
