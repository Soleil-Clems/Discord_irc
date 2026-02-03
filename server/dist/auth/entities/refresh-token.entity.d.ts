import { Users } from '@/users/entities/users.entity';
export declare class RefreshToken {
    id: number;
    tokenHash: string;
    userId: number;
    user: Users;
    expiresAt: Date;
    createdAt: Date;
    isRevoked: boolean;
}
