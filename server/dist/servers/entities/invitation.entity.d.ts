import { Server } from './server.entity';
import { Users } from '@/users/entities/users.entity';
export declare class Invitation {
    id: number;
    code: string;
    serverId: number;
    server: Server;
    createdBy: number;
    creator: Users;
    expiresAt: Date | null;
    maxUses: number | null;
    usesCount: number;
    createdAt: Date;
}
