import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ServersService } from './servers.service';
import { ServersGateway } from './servers.gateway';
import { ServersController } from './servers.controller';
import { UsersModule } from '@/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '@/users/entities/users.entity';
import { ServerMember } from './entities/server-member.entity';
import { Server } from './entities/server.entity';
import { Invitation } from './entities/invitation.entity';
import { ServerBan } from './entities/server-ban.entity';
import { jwtConstants } from '@/auth/constant';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Users, Server, ServerMember, Invitation, ServerBan]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [ServersGateway, ServersService],
  // providers: [ServersService],
  controllers: [ServersController],
})
export class ServersModule {}
