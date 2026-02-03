import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  // MessageBody,
  // ConnectedSocket,

  // MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServersService } from './servers.service';
// import { CreateServerDto } from './dto/create-server.dto';
// import { UpdateServerDto } from './dto/update-server.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '@/auth/constant';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ServersGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly serversService: ServersService,
    private readonly jwtService: JwtService,
  ) { }

  handleConnection(client: Socket) {
    console.log(`✅ Client WebSocket connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client WebSocket déconnecté: ${client.id}`);
  }

  // @SubscribeMessage('createServer')
  // create(@MessageBody() createServerDto: CreateServerDto) {
  //   return this.serversService.create(createServerDto);
  // }

  @SubscribeMessage('findAllServers')
  async findAll(
    @ConnectedSocket() client: Socket, // Correction de la syntaxe (nom: Type) + Décorateur
    @MessageBody() data: any // Même si vide, permet d'éviter des bugs de mapping
  ) {
    try {
      // 1. Récupération du token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const token = client.handshake.auth.token;

      if (!token) {
        console.error('❌ Pas de token fourni dans le handshake');
        return { error: 'No token provided' };
      }

      // 2. Vérification du JWT
      // Note : verify() renvoie le contenu du token (payload)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret, // Assure-toi que c'est bien le même secret
      });

      // 3. Extraction de l'ID (vérifie si c'est .id ou .sub dans ton token)
      const userId = payload.id;

      console.log(`📡 Fetching servers pour l'user ID: ${userId}`);

      // 4. Récupération des données
      const servers = await this.serversService.findAll(userId);

      // 5. Retour des données au client (ACK)
      return servers;
    } catch (e) {
      console.error('⚠️ JWT Error:', e.message);
      // On renvoie une erreur explicite au client
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: 'Unauthorized', message: e.message };
    }
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
