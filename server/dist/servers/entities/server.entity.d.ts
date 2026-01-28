import { ServerMember } from './server-member.entity';
export declare class Server {
    id: number;
    name: string;
    memberships: ServerMember[];
    createdAt: Date;
    updatedAt: Date;
}
