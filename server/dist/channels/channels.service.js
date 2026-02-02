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
exports.ChannelsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const channel_entity_1 = require("./entities/channel.entity");
const server_entity_1 = require("../servers/entities/server.entity");
const server_member_entity_1 = require("../servers/entities/server-member.entity");
const server_role_enum_1 = require("../servers/enums/server-role.enum");
let ChannelsService = class ChannelsService {
    channelRepository;
    serverRepository;
    serverMemberRepository;
    constructor(channelRepository, serverRepository, serverMemberRepository) {
        this.channelRepository = channelRepository;
        this.serverRepository = serverRepository;
        this.serverMemberRepository = serverMemberRepository;
    }
    async assertAdminOrOwner(serverId, userId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (!membership ||
            ![server_role_enum_1.ServerRole.Owner, server_role_enum_1.ServerRole.Admin].includes(membership.role)) {
            throw new common_1.ForbiddenException('Seuls les ADMIN ou OWNER peuvent gérer les channels');
        }
    }
    async create(dto, userId) {
        const server = await this.serverRepository.findOneBy({
            id: dto.serverId,
        });
        if (!server) {
            throw new common_1.NotFoundException('Serveur introuvable');
        }
        await this.assertAdminOrOwner(server.id, userId);
        const channel = this.channelRepository.create({
            name: dto.name,
            type: dto.type,
            server,
        });
        return this.channelRepository.save(channel);
    }
    async findAll(serverId) {
        return this.serverRepository.find({
            where: { id: serverId },
            relations: {
                channels: true,
            },
        });
    }
    async findOne(channelId) {
        const channel = await this.channelRepository.findOne({
            where: { id: channelId },
            relations: {
                server: true,
            },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel introuvable');
        }
        return channel;
    }
    async update(channelId, dto, userId) {
        const channel = await this.channelRepository.findOne({
            where: { id: channelId },
            relations: {
                server: true,
            },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel introuvable');
        }
        await this.assertAdminOrOwner(channel.server.id, userId);
        Object.assign(channel, dto);
        return this.channelRepository.save(channel);
    }
    async remove(channelId, userId) {
        const channel = await this.channelRepository.findOne({
            where: { id: channelId },
            relations: {
                server: true,
            },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel introuvable');
        }
        await this.assertAdminOrOwner(channel.server.id, userId);
        await this.channelRepository.remove(channel);
        return { success: true };
    }
};
exports.ChannelsService = ChannelsService;
exports.ChannelsService = ChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(channel_entity_1.Channel)),
    __param(1, (0, typeorm_1.InjectRepository)(server_entity_1.Server)),
    __param(2, (0, typeorm_1.InjectRepository)(server_member_entity_1.ServerMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ChannelsService);
//# sourceMappingURL=channels.service.js.map