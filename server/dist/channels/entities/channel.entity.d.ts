import { ChannelType } from '../enums/channel-type.enum';
import { Server } from '@/servers/entities/server.entity';
import { Message } from '@/messages/entities/message.entity';
export declare class Channel {
    id: number;
    name: string;
    type: ChannelType;
    server: Server;
    messages: Message[];
    createdAt: Date;
}
