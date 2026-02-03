import { Users } from '@/users/entities/users.entity';
import { PrivateMessage } from './private-message.entity';
export declare class Conversation {
    id: number;
    user1: Users;
    user2: Users;
    messages: PrivateMessage[];
    createdAt: Date;
    updatedAt: Date;
    ensureUserOrder(): void;
}
