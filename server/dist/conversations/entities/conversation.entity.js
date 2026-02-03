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
exports.Conversation = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("../../users/entities/users.entity");
const private_message_entity_1 = require("./private-message.entity");
let Conversation = class Conversation {
    id;
    user1;
    user2;
    messages;
    createdAt;
    updatedAt;
    ensureUserOrder() {
        if (this.user1 && this.user2 && this.user1.id > this.user2.id) {
            const temp = this.user1;
            this.user1 = this.user2;
            this.user2 = temp;
        }
    }
};
exports.Conversation = Conversation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Conversation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, { onDelete: 'CASCADE' }),
    __metadata("design:type", users_entity_1.Users)
], Conversation.prototype, "user1", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, { onDelete: 'CASCADE' }),
    __metadata("design:type", users_entity_1.Users)
], Conversation.prototype, "user2", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => private_message_entity_1.PrivateMessage, (message) => message.conversation),
    __metadata("design:type", Array)
], Conversation.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Conversation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Conversation.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Conversation.prototype, "ensureUserOrder", null);
exports.Conversation = Conversation = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Unique)('UQ_CONVERSATION_USERS', ['user1', 'user2'])
], Conversation);
//# sourceMappingURL=conversation.entity.js.map