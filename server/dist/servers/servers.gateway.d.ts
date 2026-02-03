import { ServersService } from './servers.service';
export declare class ServersGateway {
    private readonly serversService;
    constructor(serversService: ServersService);
    findAll(): Promise<import("./entities/server.entity").Server[]>;
}
