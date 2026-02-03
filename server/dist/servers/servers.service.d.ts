import { Repository } from 'typeorm';
import { Users } from '@/users/entities/users.entity';
import { Server } from './entities/server.entity';
import { ServerMember } from './entities/server-member.entity';
import { Invitation } from './entities/invitation.entity';
import { ServerRole } from './enums/server-role.enum';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
export declare class ServersService {
    private readonly userRepository;
    private readonly serverRepository;
    private readonly serverMemberRepository;
    private readonly invitationRepository;
    constructor(userRepository: Repository<Users>, serverRepository: Repository<Server>, serverMemberRepository: Repository<ServerMember>, invitationRepository: Repository<Invitation>);
    create(createServerDto: CreateServerDto, userId: number): Promise<Server>;
    findAll(userId: number): Promise<Server[]>;
    findOne(serverId: number, userId: number): Promise<Server>;
    update(serverId: number, updateServerDto: UpdateServerDto, userId: number): Promise<Server>;
    remove(serverId: number, userId: number): Promise<{
        success: boolean;
    }>;
    joinServer(serverId: number, userId: number): Promise<ServerMember>;
    changeMemberRole(serverId: number, requesterId: number, targetMemberId: number, role: ServerRole): Promise<ServerMember>;
    leaveServer(serverId: number, userId: number, newOwnerId?: number): Promise<{
        success: boolean;
    }>;
    createInvitation(serverId: number, userId: number, dto: CreateInvitationDto): Promise<{
        id: number;
        code: string;
        maxUses: number | null;
        usesCount: number;
        expiresAt: Date | null;
        createdAt: Date;
    }>;
    getServerInvitations(serverId: number, userId: number): Promise<Invitation[]>;
    deleteInvitation(serverId: number, invitationId: number, userId: number): Promise<{
        success: boolean;
    }>;
    joinByCode(code: string, userId: number): Promise<{
        message: string;
        server: Server;
    }>;
}
