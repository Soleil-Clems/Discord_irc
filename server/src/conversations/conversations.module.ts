import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './conversations.gateway';

import { Conversation } from './entities/conversation.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { Users } from '@/users/entities/users.entity';
import { jwtConstants } from '@/auth/constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, PrivateMessage, Users]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '5m' },
    }),
  ],
  providers: [ConversationsGateway, ConversationsService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
