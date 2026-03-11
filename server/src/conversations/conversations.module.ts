import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './conversations.gateway';

import { Conversation } from './entities/conversation.entity';
import { PrivateMessage } from './entities/private-message.entity';
import { PrivateReaction } from './entities/private-reaction.entity';
import { Users } from '@/users/entities/users.entity';
import { jwtConstants } from '@/auth/constant';
import { DmsModule } from '@/dms/dms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, PrivateMessage, PrivateReaction, Users]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '5m' },
    }),
    DmsModule,
  ],
  providers: [ConversationsGateway, ConversationsService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
