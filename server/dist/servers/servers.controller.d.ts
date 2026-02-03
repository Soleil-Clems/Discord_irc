import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { LeaveServerDto } from './dto/leave-server.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { BanUserDto } from './dto/ban-user.dto';
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
    createInvitation(req: any, serverId: number, dto: CreateInvitationDto): Promise<{
        id: number;
        code: string;
        maxUses: number | null;
        usesCount: number;
        expiresAt: Date | null;
        createdAt: Date;
    }>;
    getInvitations(req: any, serverId: number): Promise<import("./entities/invitation.entity").Invitation[]>;
    deleteInvitation(req: any, serverId: number, invitationId: number): Promise<{
        success: boolean;
    }>;
    joinByCode(req: any, code: string): Promise<{
        message: string;
        server: import("./entities/server.entity").Server;
    }>;
    banUser(req: any, serverId: number, dto: BanUserDto): Promise<{
        success: boolean;
        message: string;
    }>;
    unbanUser(req: any, serverId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getBannedUsers(req: any, serverId: number): Promise<{
        id: number;
        user: {
            id: number;
            username: string;
        };
        bannedBy: {
            id: number;
            username: string;
        } | null;
        reason: string | null;
        bannedAt: Date;
    }[]>;
}
