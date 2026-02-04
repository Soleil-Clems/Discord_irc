import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Socket, Server } from 'socket.io';
// import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { WsUser } from '@/auth/decorators/ws-user.decorator';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection() {}

  handleDisconnect() {}

  @SubscribeMessage('createMessage')
  async create(
    @WsUser() user: any,
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const newMessage = await this.messagesService.create(
      createMessageDto,
      user.id,
    );
    const roomName = `channel_${createMessageDto.channelId}`;
    this.server.to(roomName).emit('newMessage', newMessage);
    return newMessage;
  }

  @SubscribeMessage('joinChannel')
  findAll(
    @WsUser() user: any,
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: number,
  ) {
    const roomName = `channel_${channelId}`;

    client.rooms.forEach((room) => {
      if (room !== client.id) client.leave(room);
    });

    client.join(roomName);
    console.log(`Socket ${client.id} a rejoint la room : ${roomName}`);
    return this.messagesService.findAll(channelId);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: number; isTyping: boolean },
    @WsUser() user: any,
  ) {
    const roomName = `channel_${data.channelId}`;
    console.log(user.username, 'is typing in room', roomName);

    client.to(roomName).emit('userTyping', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      firstname: user.username,
      isTyping: data.isTyping,
    });
  }
  // @SubscribeMessage('findOneMessage')
  // findOne(@MessageBody() id: number) {
  //   return this.messagesService.findOne(id);
  // }
  // @SubscribeMessage('updateMessage')
  // update(@MessageBody() updateMessageDto: UpdateMessageDto) {
  //   return this.messagesService.update(updateMessageDto.id, updateMessageDto);
  // }
  // @SubscribeMessage('removeMessage')
  // remove(@MessageBody() id: number) {
  //   return this.messagesService.remove(id);
  // }
}
