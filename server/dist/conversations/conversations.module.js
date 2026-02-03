"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const conversations_service_1 = require("./conversations.service");
const conversations_controller_1 = require("./conversations.controller");
const conversations_gateway_1 = require("./conversations.gateway");
const conversation_entity_1 = require("./entities/conversation.entity");
const private_message_entity_1 = require("./entities/private-message.entity");
const users_entity_1 = require("../users/entities/users.entity");
const constant_1 = require("../auth/constant");
let ConversationsModule = class ConversationsModule {
};
exports.ConversationsModule = ConversationsModule;
exports.ConversationsModule = ConversationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([conversation_entity_1.Conversation, private_message_entity_1.PrivateMessage, users_entity_1.Users]),
            jwt_1.JwtModule.register({
                secret: constant_1.jwtConstants.secret,
                signOptions: { expiresIn: '5m' },
            }),
        ],
        providers: [conversations_gateway_1.ConversationsGateway, conversations_service_1.ConversationsService],
        controllers: [conversations_controller_1.ConversationsController],
    })
], ConversationsModule);
//# sourceMappingURL=conversations.module.js.map