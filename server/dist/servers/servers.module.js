"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServersModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const servers_service_1 = require("./servers.service");
const servers_gateway_1 = require("./servers.gateway");
const servers_controller_1 = require("./servers.controller");
const users_module_1 = require("../users/users.module");
const typeorm_1 = require("@nestjs/typeorm");
const users_entity_1 = require("../users/entities/users.entity");
const server_member_entity_1 = require("./entities/server-member.entity");
const server_entity_1 = require("./entities/server.entity");
const invitation_entity_1 = require("./entities/invitation.entity");
const constant_1 = require("../auth/constant");
let ServersModule = class ServersModule {
};
exports.ServersModule = ServersModule;
exports.ServersModule = ServersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([users_entity_1.Users, server_entity_1.Server, server_member_entity_1.ServerMember, invitation_entity_1.Invitation]),
            typeorm_1.TypeOrmModule.forFeature([users_entity_1.Users, server_entity_1.Server, server_member_entity_1.ServerMember]),
            jwt_1.JwtModule.register({
                secret: constant_1.jwtConstants.secret,
                signOptions: { expiresIn: '7d' },
            }),
        ],
        providers: [servers_gateway_1.ServersGateway, servers_service_1.ServersService],
        controllers: [servers_controller_1.ServersController],
    })
], ServersModule);
//# sourceMappingURL=servers.module.js.map