import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { LeaveServerDto } from './dto/leave-server.dto';
export declare class ServersController {
    private readonly serversService;
    constructor(serversService: ServersService);
    create(req: any, createServerDto: CreateServerDto): Promise<import("./entities/server.entity").Server>;
    findAll(req: any): Promise<import("./entities/server.entity").Server[]>;
    findOne(req: any, id: number): Promise<import("./entities/server.entity").Server>;
    update(req: any, id: number, updateServerDto: UpdateServerDto): Promise<import("./entities/server.entity").Server>;
    remove(req: any, id: number): Promise<{
        success: boolean;
    }>;
    changeRole(req: any, serverId: number, dto: ChangeRoleDto): Promise<import("./entities/server-member.entity").ServerMember>;
    join(req: any, serverId: number): Promise<import("./entities/server-member.entity").ServerMember>;
    leave(req: any, serverId: number, dto: LeaveServerDto): Promise<{
        success: boolean;
    }>;
}
