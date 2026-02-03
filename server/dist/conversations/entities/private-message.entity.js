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
exports.PrivateMessage = void 0;
const typeorm_1 = require("typeorm");
const users_entity_1 = require("../../users/entities/users.entity");
const conversation_entity_1 = require("./conversation.entity");
const message_type_enum_1 = require("../../messages/enums/message-type.enum");
let PrivateMessage = class PrivateMessage {
    id;
    content;
    type;
    sender;
    conversation;
    createdAt;
    updatedAt;
};
exports.PrivateMessage = PrivateMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PrivateMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], PrivateMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: message_type_enum_1.MessageType,
        default: message_type_enum_1.MessageType.Text,
    }),
    __metadata("design:type", String)
], PrivateMessage.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.Users, { onDelete: 'CASCADE' }),
    __metadata("design:type", users_entity_1.Users)
], PrivateMessage.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => conversation_entity_1.Conversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", conversation_entity_1.Conversation)
], PrivateMessage.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PrivateMessage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PrivateMessage.prototype, "updatedAt", void 0);
exports.PrivateMessage = PrivateMessage = __decorate([
    (0, typeorm_1.Entity)()
], PrivateMessage);
//# sourceMappingURL=private-message.entity.js.map