import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsController } from './channels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerMember } from '@/servers/entities/server-member.entity';
import { Server } from '@/servers/entities/server.entity';
import { Channel } from './entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Server, ServerMember])],
  providers: [ChannelsGateway, ChannelsService],
  controllers: [ChannelsController],
})
export class ChannelsModule {}
