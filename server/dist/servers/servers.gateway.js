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
exports.ServersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const servers_service_1 = require("./servers.service");
const jwt_1 = require("@nestjs/jwt");
const constant_1 = require("../auth/constant");
let ServersGateway = class ServersGateway {
    serversService;
    jwtService;
    server;
    constructor(serversService, jwtService) {
        this.serversService = serversService;
        this.jwtService = jwtService;
    }
    handleConnection(client) {
        console.log(`✅ Client WebSocket connecté: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`❌ Client WebSocket déconnecté: ${client.id}`);
    }
    async findAll(client, data) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                console.error('❌ Pas de token fourni dans le handshake');
                return { error: 'No token provided' };
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: constant_1.jwtConstants.secret,
            });
            const userId = payload.id;
            console.log(`📡 Fetching servers pour l'user ID: ${userId}`);
            const servers = await this.serversService.findAll(userId);
            return servers;
        }
        catch (e) {
            console.error('⚠️ JWT Error:', e.message);
            return { error: 'Unauthorized', message: e.message };
        }
    }
};
exports.ServersGateway = ServersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ServersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('findAllServers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ServersGateway.prototype, "findAll", null);
exports.ServersGateway = ServersGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [servers_service_1.ServersService,
        jwt_1.JwtService])
], ServersGateway);
//# sourceMappingURL=servers.gateway.js.map