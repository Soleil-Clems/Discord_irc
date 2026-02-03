import { Users } from 'src/users/entities/users.entity';
import { Server } from './server.entity';
export declare class ServerBan {
    id: number;
    server: Server;
    user: Users;
    bannedBy: Users;
    reason: string | null;
    bannedAt: Date;
}
