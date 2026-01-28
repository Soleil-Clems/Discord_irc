import { Users } from 'src/users/entities/users.entity';
import { Server } from './server.entity';
import { ServerRole } from '../enums/server-role.enum';
export declare class ServerMember {
    id: number;
    members: Users;
    server: Server;
    role: ServerRole;
    joinedAt: Date;
}
