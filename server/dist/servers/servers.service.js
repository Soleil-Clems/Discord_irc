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
exports.ServersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_entity_1 = require("../users/entities/users.entity");
const server_entity_1 = require("./entities/server.entity");
const server_member_entity_1 = require("./entities/server-member.entity");
const server_role_enum_1 = require("./enums/server-role.enum");
let ServersService = class ServersService {
    userRepository;
    serverRepository;
    serverMemberRepository;
    constructor(userRepository, serverRepository, serverMemberRepository) {
        this.userRepository = userRepository;
        this.serverRepository = serverRepository;
        this.serverMemberRepository = serverMemberRepository;
    }
    async create(createServerDto, userId) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const server = this.serverRepository.create({
            name: createServerDto.name,
        });
        await this.serverRepository.save(server);
        const ownerMembership = this.serverMemberRepository.create({
            members: user,
            server: server,
            role: server_role_enum_1.ServerRole.Owner,
        });
        await this.serverMemberRepository.save(ownerMembership);
        return server;
    }
    async findAll(userId) {
        const memberships = await this.serverMemberRepository.find({
            where: {
                members: { id: userId },
            },
            relations: {
                server: {
                    channels: true,
                    memberships: {
                        members: true,
                    },
                },
            },
        });
        return memberships.map((membership) => membership.server);
    }
    async findOne(serverId, userId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Vous ne faites pas partie de ce serveur');
        }
        const server = await this.serverRepository.findOne({
            where: { id: serverId },
            relations: {
                memberships: {
                    members: true,
                },
                channels: true,
            },
        });
        if (!server) {
            throw new common_1.NotFoundException('Serveur non trouvé');
        }
        return server;
    }
    async update(serverId, updateServerDto, userId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
            relations: {
                server: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Vous ne faites pas partie du serveur');
        }
        if (membership.role !== server_role_enum_1.ServerRole.Owner) {
            throw new common_1.ForbiddenException('Seul le propriétaire peut modifier le serveur');
        }
        Object.assign(membership.server, updateServerDto);
        return this.serverRepository.save(membership.server);
    }
    async remove(serverId, userId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
            relations: {
                server: true,
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Accès refusé');
        }
        if (membership.role !== server_role_enum_1.ServerRole.Owner) {
            throw new common_1.ForbiddenException('Seul le propriétaire peut supprimer le serveur');
        }
        await this.serverRepository.remove(membership.server);
        return { success: true };
    }
    async joinServer(serverId, userId) {
        const exists = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (exists) {
            throw new common_1.ForbiddenException('Déjà membre');
        }
        const member = this.serverMemberRepository.create({
            server: { id: serverId },
            members: { id: userId },
            role: server_role_enum_1.ServerRole.Member,
        });
        return this.serverMemberRepository.save(member);
    }
    async changeMemberRole(serverId, requesterId, targetMemberId, role) {
        const requester = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: requesterId },
            },
        });
        if (!requester || requester.role !== server_role_enum_1.ServerRole.Owner) {
            throw new common_1.ForbiddenException('Seul le OWNER peut changer les rôles');
        }
        const target = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: targetMemberId },
            },
        });
        if (!target) {
            throw new common_1.NotFoundException('Membre introuvable');
        }
        target.role = role;
        return this.serverMemberRepository.save(target);
    }
    async leaveServer(serverId, userId, newOwnerId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (!membership) {
            throw new common_1.NotFoundException('Vous ne faites pas partie du serveur');
        }
        if (membership.role === server_role_enum_1.ServerRole.Owner) {
            if (!newOwnerId) {
                throw new common_1.ForbiddenException('Le OWNER doit transférer la propriété');
            }
            const newOwner = await this.serverMemberRepository.findOne({
                where: {
                    server: { id: serverId },
                    members: { id: newOwnerId },
                },
            });
            if (!newOwner) {
                throw new common_1.NotFoundException('Nouveau OWNER invalide');
            }
            newOwner.role = server_role_enum_1.ServerRole.Owner;
            await this.serverMemberRepository.save(newOwner);
        }
        await this.serverMemberRepository.remove(membership);
        return { success: true };
    }
};
exports.ServersService = ServersService;
exports.ServersService = ServersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(1, (0, typeorm_1.InjectRepository)(server_entity_1.Server)),
    __param(2, (0, typeorm_1.InjectRepository)(server_member_entity_1.ServerMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ServersService);
//# sourceMappingURL=servers.service.js.map