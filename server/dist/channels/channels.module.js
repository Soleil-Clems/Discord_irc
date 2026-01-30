"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsModule = void 0;
const common_1 = require("@nestjs/common");
const channels_service_1 = require("./channels.service");
const channels_gateway_1 = require("./channels.gateway");
const channels_controller_1 = require("./channels.controller");
const typeorm_1 = require("@nestjs/typeorm");
const server_member_entity_1 = require("../servers/entities/server-member.entity");
const server_entity_1 = require("../servers/entities/server.entity");
const channel_entity_1 = require("./entities/channel.entity");
let ChannelsModule = class ChannelsModule {
};
exports.ChannelsModule = ChannelsModule;
exports.ChannelsModule = ChannelsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([channel_entity_1.Channel, server_entity_1.Server, server_member_entity_1.ServerMember])],
        providers: [channels_gateway_1.ChannelsGateway, channels_service_1.ChannelsService],
        controllers: [channels_controller_1.ChannelsController],
    })
], ChannelsModule);
//# sourceMappingURL=channels.module.js.map