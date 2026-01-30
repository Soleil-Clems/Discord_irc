import { ChannelType } from '../enums/channel-type.enum';
import { Server } from '@/servers/entities/server.entity';
export declare class Channel {
    id: number;
    name: string;
    type: ChannelType;
    server: Server;
    createdAt: Date;
}
