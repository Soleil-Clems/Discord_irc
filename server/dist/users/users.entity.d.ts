import { Role } from './enums/roles.enum';
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
}
