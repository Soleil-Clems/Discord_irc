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
exports.ServerBan = void 0;
const users_entity_1 = require("../../users/entities/users.entity");
const typeorm_1 = require("typeorm");
const server_entity_1 = require("./server.entity");
let ServerBan = class ServerBan {
    id;
    server;
    user;
    bannedBy;
    reason;
    bannedAt;
};
exports.ServerBan = ServerBan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServerBan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => server_entity_1.Server, { onDelete: 'CASCADE' }),
    __metadata("design:type", server_entity_1.Server)
], ServerBan.prototype, "server", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, { onDelete: 'CASCADE' }),
    __metadata("design:type", users_entity_1.Users)
], ServerBan.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, { onDelete: 'SET NULL' }),
    __metadata("design:type", users_entity_1.Users)
], ServerBan.prototype, "bannedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServerBan.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServerBan.prototype, "bannedAt", void 0);
exports.ServerBan = ServerBan = __decorate([
    (0, typeorm_1.Entity)('server_bans'),
    (0, typeorm_1.Unique)('UQ_SERVER_BAN', ['server', 'user'])
], ServerBan);
//# sourceMappingURL=server-ban.entity.js.map