import { Users } from '@/users/entities/users.entity';
import { Channel } from '@/channels/entities/channel.entity';
import { MessageType } from '../enums/message-type.enum';
export declare class Message {
    id: number;
    content: string;
    type: MessageType;
    author: Users;
    channel: Channel;
    createdAt: Date;
}
