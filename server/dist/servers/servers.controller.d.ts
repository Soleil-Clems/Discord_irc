import { CreateServerDto } from './dto/create-server.dto';
import { ServersService } from './servers.service';
export declare class ServersController {
    private readonly serversService;
    constructor(serversService: ServersService);
    create(req: any, createServerDto: CreateServerDto): Promise<import("./entities/server.entity").Server>;
}
