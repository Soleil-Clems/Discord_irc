import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServersService } from './servers.service';
import { JwtService } from '@nestjs/jwt';
export declare class ServersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly serversService;
    private readonly jwtService;
    server: Server;
    constructor(serversService: ServersService, jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    findAll(user: any): Promise<import("./entities/server.entity").Server[]>;
}
