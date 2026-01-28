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
exports.ServerMember = void 0;
const users_entity_1 = require("../../users/entities/users.entity");
const typeorm_1 = require("typeorm");
const server_entity_1 = require("./server.entity");
const server_role_enum_1 = require("../enums/server-role.enum");
let ServerMember = class ServerMember {
    id;
    members;
    server;
    role;
    joinedAt;
};
exports.ServerMember = ServerMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServerMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, (user) => user.serverMemberships),
    __metadata("design:type", users_entity_1.Users)
], ServerMember.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => server_entity_1.Server, (server) => server.memberships),
    __metadata("design:type", server_entity_1.Server)
], ServerMember.prototype, "server", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: server_role_enum_1.ServerRole,
        default: server_role_enum_1.ServerRole.Member,
    }),
    __metadata("design:type", String)
], ServerMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServerMember.prototype, "joinedAt", void 0);
exports.ServerMember = ServerMember = __decorate([
    (0, typeorm_1.Entity)()
], ServerMember);
//# sourceMappingURL=server-member.entity.js.map