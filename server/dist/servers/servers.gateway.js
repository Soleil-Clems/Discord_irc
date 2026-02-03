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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const servers_service_1 = require("./servers.service");
let ServersGateway = class ServersGateway {
    serversService;
    constructor(serversService) {
        this.serversService = serversService;
    }
    findAll() {
        return this.serversService.findAll(1);
    }
};
exports.ServersGateway = ServersGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('findAllServers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServersGateway.prototype, "findAll", null);
exports.ServersGateway = ServersGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [servers_service_1.ServersService])
], ServersGateway);
//# sourceMappingURL=servers.gateway.js.map