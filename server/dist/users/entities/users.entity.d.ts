import { Role } from '../enums/roles.enum';
import { ServerMember } from '../../servers/entities/server-member.entity';
import { Message } from '@/messages/entities/message.entity';
export declare class Users {
    id: number;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    role: Role;
    serverMemberships: ServerMember[];
    messages: Message[];
}
