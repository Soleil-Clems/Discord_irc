import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '@/channels/entities/channel.entity';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { Server } from '@/servers/entities/server.entity';
import { Message } from './entities/message.entity';
import { Users } from '@/users/entities/users.entity'; // 👈 ajouté
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@/auth/constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, Server, ServerMember, Users]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [MessagesGateway, MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
