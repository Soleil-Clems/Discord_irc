import { ServerMember } from './server-member.entity';
import { Channel } from '@/channels/entities/channel.entity';
export declare class Server {
    id: number;
    name: string;
    memberships: ServerMember[];
    createdAt: Date;
    updatedAt: Date;
    channels: Channel[];
}
