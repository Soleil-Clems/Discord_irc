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
exports.Invitation = void 0;
const typeorm_1 = require("typeorm");
const server_entity_1 = require("./server.entity");
const users_entity_1 = require("../../users/entities/users.entity");
let Invitation = class Invitation {
    id;
    code;
    serverId;
    server;
    createdBy;
    creator;
    expiresAt;
    maxUses;
    usesCount;
    createdAt;
};
exports.Invitation = Invitation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Invitation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16, unique: true }),
    __metadata("design:type", String)
], Invitation.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'server_id' }),
    __metadata("design:type", Number)
], Invitation.prototype, "serverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => server_entity_1.Server, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'server_id' }),
    __metadata("design:type", server_entity_1.Server)
], Invitation.prototype, "server", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by' }),
    __metadata("design:type", Number)
], Invitation.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", users_entity_1.Users)
], Invitation.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Invitation.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_uses', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Invitation.prototype, "maxUses", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uses_count', default: 0 }),
    __metadata("design:type", Number)
], Invitation.prototype, "usesCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Invitation.prototype, "createdAt", void 0);
exports.Invitation = Invitation = __decorate([
    (0, typeorm_1.Entity)('invitations')
], Invitation);
//# sourceMappingURL=invitation.entity.js.map