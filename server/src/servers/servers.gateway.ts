import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  // ConnectedSocket,
  // MessageBody,
  // MessageBody,
  // ConnectedSocket,

  // MessageBody,
} from '@nestjs/websockets';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { Server, Socket } from 'socket.io';
import { ServersService } from './servers.service';
// import { CreateServerDto } from './dto/create-server.dto';
// import { UpdateServerDto } from './dto/update-server.dto';
import { JwtService } from '@nestjs/jwt';
import { WsUser } from '@/auth/decorators/ws-user.decorator';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class ServersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly serversService: ServersService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client WebSocket connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client WebSocket déconnecté: ${client.id}`);
  }

  // @SubscribeMessage('createServer')
  // create(@MessageBody() createServerDto: CreateServerDto) {
  //   return this.serversService.create(createServerDto);
  // }

  @SubscribeMessage('findAllServers')
  findAll(@WsUser() user: any) {
    return this.serversService.findAll(user.id);
  }
  // @SubscribeMessage('findOneServer')
  // findOne(@MessageBody() id: number) {
  //   return this.serversService.findOne(id);
  // }
  // @SubscribeMessage('updateServer')
  // update(@MessageBody() updateServerDto: UpdateServerDto) {
  //   return this.serversService.update(updateServerDto.id, updateServerDto);
  // }
  // @SubscribeMessage('removeServer')
  // remove(@MessageBody() id: number) {
  //   return this.serversService.remove(id);
  // }
}
