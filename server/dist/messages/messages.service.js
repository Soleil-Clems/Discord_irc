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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./entities/message.entity");
const channel_entity_1 = require("../channels/entities/channel.entity");
const users_entity_1 = require("../users/entities/users.entity");
const server_member_entity_1 = require("../servers/entities/server-member.entity");
const server_role_enum_1 = require("../servers/enums/server-role.enum");
let MessagesService = class MessagesService {
    messageRepository;
    channelRepository;
    userRepository;
    serverMemberRepository;
    constructor(messageRepository, channelRepository, userRepository, serverMemberRepository) {
        this.messageRepository = messageRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
        this.serverMemberRepository = serverMemberRepository;
    }
    async create(createMessageDto, userId) {
        const channel = await this.channelRepository.findOne({
            where: { id: createMessageDto.channelId },
            relations: { server: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel introuvable');
        }
        const member = await this.serverMemberRepository.findOne({
            where: {
                server: { id: channel.server.id },
                members: { id: userId },
            },
        });
        if (!member) {
            throw new common_1.ForbiddenException('Accès refusé');
        }
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur introuvable');
        }
        const message = this.messageRepository.create({
            content: createMessageDto.content,
            type: createMessageDto.type,
            author: user,
            channel: channel,
        });
        return this.messageRepository.save(message);
    }
    async findAll(channelId) {
        return this.messageRepository.find({
            where: { channel: { id: channelId } },
            relations: { author: true },
            order: { createdAt: 'ASC' },
        });
    }
    async update(messageId, updateMessageDto, userId) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: {
                author: true,
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message introuvable');
        }
        if (message.author.id !== userId) {
            throw new common_1.ForbiddenException('Vous ne pouvez modifier ce message');
        }
        Object.assign(message, updateMessageDto);
        return this.messageRepository.save(message);
    }
    async remove(messageId, userId) {
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: {
                author: true,
                channel: {
                    server: true,
                },
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message introuvable');
        }
        if (message.author.id === userId) {
            await this.messageRepository.remove(message);
            return { success: true };
        }
        const member = await this.serverMemberRepository.findOne({
            where: {
                server: { id: message.channel.server.id },
                members: { id: userId },
            },
        });
        if (!member ||
            (member.role !== server_role_enum_1.ServerRole.Owner && member.role !== server_role_enum_1.ServerRole.Admin)) {
            throw new common_1.ForbiddenException('Suppression non autorisée');
        }
        await this.messageRepository.remove(message);
        return { success: true };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(channel_entity_1.Channel)),
    __param(2, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __param(3, (0, typeorm_1.InjectRepository)(server_member_entity_1.ServerMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MessagesService);
//# sourceMappingURL=messages.service.js.map