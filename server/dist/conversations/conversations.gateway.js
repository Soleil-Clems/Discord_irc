"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const constant_1 = require("../auth/constant");
const conversations_service_1 = require("./conversations.service");
const send_private_message_dto_1 = require("./dto/send-private-message.dto");
const typing_indicator_dto_1 = require("./dto/typing-indicator.dto");
let ConversationsGateway = class ConversationsGateway {
    conversationsService;
    jwtService;
    server;
    userSockets = new Map();
    constructor(conversationsService, jwtService) {
        this.conversationsService = conversationsService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: constant_1.jwtConstants.secret,
            });
            const userId = payload.id;
            client.userId = userId;
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);
            client.join(`user:${userId}`);
            console.log(`✅ Conversations: User ${userId} connecté (${client.id})`);
        }
        catch (e) {
            console.error('⚠️ Conversations JWT Error:', e.message);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            const userSocketSet = this.userSockets.get(client.userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(client.userId);
                }
            }
            console.log(`❌ Conversations: User ${client.userId} déconnecté (${client.id})`);
        }
    }
    async getUserIdFromSocket(client) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                return null;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: constant_1.jwtConstants.secret,
            });
            return payload.id;
        }
        catch {
            return null;
        }
    }
    async handleSendPrivateMessage(client, data) {
        try {
            const userId = await this.getUserIdFromSocket(client);
            if (!userId) {
                return { error: 'Unauthorized' };
            }
            const message = await this.conversationsService.createMessage(data.conversationId, { content: data.content, type: data.type }, userId);
            const otherUser = await this.conversationsService.getOtherUser(data.conversationId, userId);
            this.server.to(`user:${otherUser.id}`).emit('newPrivateMessage', message);
            return message;
        }
        catch (e) {
            console.error('⚠️ sendPrivateMessage Error:', e.message);
            return { error: e.message };
        }
    }
    async handleTyping(client, data) {
        try {
            const userId = await this.getUserIdFromSocket(client);
            if (!userId) {
                return { error: 'Unauthorized' };
            }
            const otherUser = await this.conversationsService.getOtherUser(data.conversationId, userId);
            this.server.to(`user:${otherUser.id}`).emit('userTyping', {
                conversationId: data.conversationId,
                userId,
            });
            return { success: true };
        }
        catch (e) {
            console.error('⚠️ typing Error:', e.message);
            return { error: e.message };
        }
    }
    async handleStopTyping(client, data) {
        try {
            const userId = await this.getUserIdFromSocket(client);
            if (!userId) {
                return { error: 'Unauthorized' };
            }
            const otherUser = await this.conversationsService.getOtherUser(data.conversationId, userId);
            this.server.to(`user:${otherUser.id}`).emit('userStoppedTyping', {
                conversationId: data.conversationId,
                userId,
            });
            return { success: true };
        }
        catch (e) {
            console.error('⚠️ stopTyping Error:', e.message);
            return { error: e.message };
        }
    }
};
exports.ConversationsGateway = ConversationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ConversationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendPrivateMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        send_private_message_dto_1.SendPrivateMessageDto]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleSendPrivateMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        typing_indicator_dto_1.TypingIndicatorDto]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stopTyping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        typing_indicator_dto_1.TypingIndicatorDto]),
    __metadata("design:returntype", Promise)
], ConversationsGateway.prototype, "handleStopTyping", null);
exports.ConversationsGateway = ConversationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService,
        jwt_1.JwtService])
], ConversationsGateway);
//# sourceMappingURL=conversations.gateway.js.map