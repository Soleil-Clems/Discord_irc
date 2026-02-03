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
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("./entities/conversation.entity");
const private_message_entity_1 = require("./entities/private-message.entity");
const users_entity_1 = require("../users/entities/users.entity");
let ConversationsService = class ConversationsService {
    conversationRepository;
    privateMessageRepository;
    userRepository;
    constructor(conversationRepository, privateMessageRepository, userRepository) {
        this.conversationRepository = conversationRepository;
        this.privateMessageRepository = privateMessageRepository;
        this.userRepository = userRepository;
    }
    async createOrGet(createConversationDto, currentUserId) {
        const { userId: otherUserId } = createConversationDto;
        if (currentUserId === otherUserId) {
            throw new common_1.BadRequestException('Vous ne pouvez pas créer une conversation avec vous-même');
        }
        const currentUser = await this.userRepository.findOneBy({
            id: currentUserId,
        });
        const otherUser = await this.userRepository.findOneBy({ id: otherUserId });
        if (!currentUser || !otherUser) {
            throw new common_1.NotFoundException('Utilisateur introuvable');
        }
        const [user1, user2] = currentUserId < otherUserId
            ? [currentUser, otherUser]
            : [otherUser, currentUser];
        let conversation = await this.conversationRepository.findOne({
            where: {
                user1: { id: user1.id },
                user2: { id: user2.id },
            },
            relations: { user1: true, user2: true },
        });
        if (!conversation) {
            conversation = this.conversationRepository.create({
                user1,
                user2,
            });
            conversation = await this.conversationRepository.save(conversation);
            conversation = await this.conversationRepository.findOne({
                where: { id: conversation.id },
                relations: { user1: true, user2: true },
            });
        }
        return conversation;
    }
    async findAll(userId) {
        const conversations = await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.user1', 'user1')
            .leftJoinAndSelect('conversation.user2', 'user2')
            .where('user1.id = :userId', { userId })
            .orWhere('user2.id = :userId', { userId })
            .orderBy('conversation.updatedAt', 'DESC')
            .getMany();
        return conversations;
    }
    async findOne(conversationId, userId) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId },
            relations: { user1: true, user2: true },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation introuvable');
        }
        if (conversation.user1.id !== userId && conversation.user2.id !== userId) {
            throw new common_1.ForbiddenException('Accès refusé');
        }
        return conversation;
    }
    async findMessages(conversationId, userId, page = 1, limit = 50) {
        const conversation = await this.findOne(conversationId, userId);
        const [messages, total] = await this.privateMessageRepository.findAndCount({
            where: { conversation: { id: conversation.id } },
            relations: { sender: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            messages: messages.reverse(),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async createMessage(conversationId, createMessageDto, senderId) {
        const conversation = await this.findOne(conversationId, senderId);
        const sender = await this.userRepository.findOneBy({ id: senderId });
        if (!sender) {
            throw new common_1.NotFoundException('Utilisateur introuvable');
        }
        const message = this.privateMessageRepository.create({
            content: createMessageDto.content,
            type: createMessageDto.type,
            sender,
            conversation,
        });
        const savedMessage = await this.privateMessageRepository.save(message);
        conversation.updatedAt = new Date();
        await this.conversationRepository.save(conversation);
        return this.privateMessageRepository.findOne({
            where: { id: savedMessage.id },
            relations: { sender: true, conversation: { user1: true, user2: true } },
        });
    }
    async updateMessage(messageId, updateMessageDto, userId) {
        const message = await this.privateMessageRepository.findOne({
            where: { id: messageId },
            relations: { sender: true, conversation: { user1: true, user2: true } },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message introuvable');
        }
        if (message.sender.id !== userId) {
            throw new common_1.ForbiddenException('Vous ne pouvez modifier ce message');
        }
        Object.assign(message, updateMessageDto);
        return this.privateMessageRepository.save(message);
    }
    async removeMessage(messageId, userId) {
        const message = await this.privateMessageRepository.findOne({
            where: { id: messageId },
            relations: { sender: true, conversation: { user1: true, user2: true } },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message introuvable');
        }
        if (message.sender.id !== userId) {
            throw new common_1.ForbiddenException('Suppression non autorisée');
        }
        await this.privateMessageRepository.remove(message);
        return { success: true };
    }
    async getOtherUser(conversationId, userId) {
        const conversation = await this.findOne(conversationId, userId);
        return conversation.user1.id === userId
            ? conversation.user2
            : conversation.user1;
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(private_message_entity_1.PrivateMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(users_entity_1.Users)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map