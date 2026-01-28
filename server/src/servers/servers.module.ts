import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersGateway } from './servers.gateway';
import { ServersController } from './servers.controller';

@Module({
  providers: [ServersGateway, ServersService],
  controllers: [ServersController],
})
export class ServersModule {}
