import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@WebSocketGateway()
export class ServersGateway {
  constructor(private readonly serversService: ServersService) {}

  @SubscribeMessage('createServer')
  create(@MessageBody() createServerDto: CreateServerDto) {
    return this.serversService.create(createServerDto);
  }

  @SubscribeMessage('findAllServers')
  findAll() {
    return this.serversService.findAll();
  }

  @SubscribeMessage('findOneServer')
  findOne(@MessageBody() id: number) {
    return this.serversService.findOne(id);
  }

  @SubscribeMessage('updateServer')
  update(@MessageBody() updateServerDto: UpdateServerDto) {
    return this.serversService.update(updateServerDto.id, updateServerDto);
  }

  @SubscribeMessage('removeServer')
  remove(@MessageBody() id: number) {
    return this.serversService.remove(id);
  }
}
