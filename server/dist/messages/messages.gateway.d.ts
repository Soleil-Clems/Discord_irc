import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagesService;
    private readonly jwtService;
    server: Server;
    constructor(messagesService: MessagesService, jwtService: JwtService);
    handleConnection(): void;
    handleDisconnect(): void;
    create(user: any, client: Socket, createMessageDto: CreateMessageDto): Promise<import("./entities/message.entity").Message>;
    findAll(user: any, client: Socket, channelId: number): Promise<import("./entities/message.entity").Message[]>;
    handleTyping(client: Socket, data: {
        channelId: number;
        isTyping: boolean;
    }, user: any): void;
}
