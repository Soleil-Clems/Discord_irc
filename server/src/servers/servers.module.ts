import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
// import { ServersGateway } from './servers.gateway';
import { ServersController } from './servers.controller';
import { UsersModule } from '@/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '@/users/entities/users.entity';
import { ServerMember } from './entities/server-member.entity';
import { Server } from './entities/server.entity';
import { Invitation } from './entities/invitation.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Users, Server, ServerMember, Invitation]),
  ],
  // providers: [ServersGateway, ServersService],
  providers: [ServersService],
  controllers: [ServersController],
})
export class ServersModule {}
