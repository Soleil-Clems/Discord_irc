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
const servers_service_1 = require("./servers.service");
const create_server_dto_1 = require("./dto/create-server.dto");
const update_server_dto_1 = require("./dto/update-server.dto");
let ServersGateway = class ServersGateway {
    serversService;
    constructor(serversService) {
        this.serversService = serversService;
    }
    create(createServerDto) {
        return this.serversService.create(createServerDto);
    }
    findAll() {
        return this.serversService.findAll();
    }
    findOne(id) {
        return this.serversService.findOne(id);
    }
    update(updateServerDto) {
        return this.serversService.update(updateServerDto.id, updateServerDto);
    }
    remove(id) {
        return this.serversService.remove(id);
    }
};
exports.ServersGateway = ServersGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('createServer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_server_dto_1.CreateServerDto]),
    __metadata("design:returntype", void 0)
], ServersGateway.prototype, "create", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('findAllServers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServersGateway.prototype, "findAll", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('findOneServer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServersGateway.prototype, "findOne", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateServer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_server_dto_1.UpdateServerDto]),
    __metadata("design:returntype", void 0)
], ServersGateway.prototype, "update", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeServer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServersGateway.prototype, "remove", null);
exports.ServersGateway = ServersGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [servers_service_1.ServersService])
], ServersGateway);
//# sourceMappingURL=servers.gateway.js.map