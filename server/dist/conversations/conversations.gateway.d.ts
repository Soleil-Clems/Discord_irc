import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Users } from '@/users/entities/users.entity';
import { Repository } from 'typeorm';
import { ConversationsService } from './conversations.service';
import { SendPrivateMessageDto } from './dto/send-private-message.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';
interface AuthenticatedSocket extends Socket {
    userId?: number;
}
export declare class ConversationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly conversationsService;
    private readonly jwtService;
    private readonly userRepository;
    server: Server;
    private userSockets;
    constructor(conversationsService: ConversationsService, jwtService: JwtService, userRepository: Repository<Users>);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    private getUserIdFromSocket;
    handleSendPrivateMessage(client: Socket, data: SendPrivateMessageDto): Promise<import("./entities/private-message.entity").PrivateMessage | {
        error: any;
    } | null>;
    handleTyping(client: Socket, data: TypingIndicatorDto): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
    handleStopTyping(client: Socket, data: TypingIndicatorDto): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        error: any;
        success?: undefined;
    }>;
}
export {};
