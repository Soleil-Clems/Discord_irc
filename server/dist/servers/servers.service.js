"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const crypto = __importStar(require("crypto"));
const users_entity_1 = require("../users/entities/users.entity");
const server_entity_1 = require("./entities/server.entity");
const server_member_entity_1 = require("./entities/server-member.entity");
const invitation_entity_1 = require("./entities/invitation.entity");
const server_role_enum_1 = require("./enums/server-role.enum");
let ServersService = class ServersService {
    userRepository;
    serverRepository;
    serverMemberRepository;
    invitationRepository;
    constructor(userRepository, serverRepository, serverMemberRepository, invitationRepository) {
        this.userRepository = userRepository;
        this.serverRepository = serverRepository;
        this.serverMemberRepository = serverMemberRepository;
        this.invitationRepository = invitationRepository;
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
    async createInvitation(serverId, userId, dto) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Vous ne faites pas partie du serveur');
        }
        if (membership.role !== server_role_enum_1.ServerRole.Owner &&
            membership.role !== server_role_enum_1.ServerRole.Admin) {
            throw new common_1.ForbiddenException('Seuls les admins peuvent créer des invitations');
        }
        const code = crypto.randomBytes(8).toString('hex');
        const expiresAt = dto.expiresIn
            ? new Date(Date.now() + dto.expiresIn * 1000)
            : null;
        const invitation = new invitation_entity_1.Invitation();
        invitation.code = code;
        invitation.serverId = serverId;
        invitation.createdBy = userId;
        invitation.expiresAt = expiresAt;
        invitation.maxUses = dto.maxUses || null;
        await this.invitationRepository.save(invitation);
        return {
            id: invitation.id,
            code: invitation.code,
            maxUses: invitation.maxUses,
            usesCount: invitation.usesCount,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
        };
    }
    async getServerInvitations(serverId, userId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Vous ne faites pas partie du serveur');
        }
        if (membership.role !== server_role_enum_1.ServerRole.Owner &&
            membership.role !== server_role_enum_1.ServerRole.Admin) {
            throw new common_1.ForbiddenException('Seuls les admins peuvent voir les invitations');
        }
        return this.invitationRepository.find({
            where: { serverId },
            relations: ['creator'],
            order: { createdAt: 'DESC' },
        });
    }
    async deleteInvitation(serverId, invitationId, userId) {
        const membership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: serverId },
                members: { id: userId },
            },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('Vous ne faites pas partie du serveur');
        }
        if (membership.role !== server_role_enum_1.ServerRole.Owner &&
            membership.role !== server_role_enum_1.ServerRole.Admin) {
            throw new common_1.ForbiddenException('Seuls les admins peuvent supprimer des invitations');
        }
        const invitation = await this.invitationRepository.findOne({
            where: { id: invitationId, serverId },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation non trouvée');
        }
        await this.invitationRepository.remove(invitation);
        return { success: true };
    }
    async joinByCode(code, userId) {
        const invitation = await this.invitationRepository.findOne({
            where: { code },
            relations: ['server'],
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation invalide');
        }
        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invitation expirée');
        }
        if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
            throw new common_1.BadRequestException("L'invitation a atteint le nombre maximum d'utilisations");
        }
        const existingMembership = await this.serverMemberRepository.findOne({
            where: {
                server: { id: invitation.serverId },
                members: { id: userId },
            },
        });
        if (existingMembership) {
            throw new common_1.BadRequestException('Vous êtes déjà membre de ce serveur');
        }
        const member = this.serverMemberRepository.create({
            server: { id: invitation.serverId },
            members: { id: userId },
            role: server_role_enum_1.ServerRole.Member,
        });
        await this.serverMemberRepository.save(member);
        invitation.usesCount += 1;
        await this.invitationRepository.save(invitation);
        return {
            message: 'Vous avez rejoint le serveur',
            server: invitation.server,
        };
    }
};
exports.ServersService = ServersService;
exports.ServersService = ServersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(1, (0, typeorm_1.InjectRepository)(server_entity_1.Server)),
    __param(2, (0, typeorm_1.InjectRepository)(server_member_entity_1.ServerMember)),
    __param(3, (0, typeorm_1.InjectRepository)(invitation_entity_1.Invitation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ServersService);
//# sourceMappingURL=servers.service.js.map