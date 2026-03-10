import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '@/channels/entities/channel.entity';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { Server } from '@/servers/entities/server.entity';
import { Message } from './entities/message.entity';
import { Reaction } from './entities/reaction.entity';
import { Users } from '@/users/entities/users.entity'; // 👈 ajouté
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@/auth/constant';
import { DmsModule } from '@/dms/dms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, Server, ServerMember, Users, Reaction]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
    DmsModule,
  ],
  providers: [MessagesGateway, MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
