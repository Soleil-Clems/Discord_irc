import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsJwtGuard } from '@/auth/guards/ws-jwt.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Socket, Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { WsUser } from '@/auth/decorators/ws-user.decorator';
import { CreateReactionDto } from './dto/create-reaction.dto';

@WebSocketGateway()
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

    try {
      const notifInfo = await this.messagesService.getChannelNotificationInfo(
        createMessageDto.channelId,
        user.id,
      );
      if (notifInfo && notifInfo.memberIds.length > 0) {
        const payload = {
          messageId: newMessage.id,
          channelId: notifInfo.channelId,
          channelName: notifInfo.channelName,
          serverId: notifInfo.serverId,
          serverName: notifInfo.serverName,
          senderId: user.id,
          senderName: user.username,
          contentPreview: createMessageDto.content.slice(0, 200),
        };
        const rooms = notifInfo.memberIds.map((id) => `user:${id}`);
        this.server.to(rooms).emit('channelMessageNotification', payload);
      }
    } catch (err) {
      console.warn('channelMessageNotification dispatch failed', err);
    }

    return newMessage;
  }

  @SubscribeMessage('joinChannel')
  async joinChannel(
    @WsUser() user: any,
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: number,
  ) {
    const roomName = `channel_${channelId}`;

    client.rooms.forEach((room) => {
      if (room.startsWith('channel_')) client.leave(room);
    });

    await client.join(roomName);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: number; isTyping: boolean },
    @WsUser() user: any,
  ) {
    const roomName = `channel_${data.channelId}`;

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

  @SubscribeMessage('updateMessage')
  async update(
    @WsUser() user: any,
    @MessageBody()
    data: { messageId: number; channelId: number } & UpdateMessageDto,
  ) {
    const updatedMessage = await this.messagesService.update(
      data.messageId,
      { content: data.content },
      user.id,
    );
    const roomName = `channel_${data.channelId}`;
    this.server.to(roomName).emit('messageUpdated', updatedMessage);
    return updatedMessage;
  }

  @SubscribeMessage('addReaction')
  async reaction(
    @WsUser() user: any,
    @MessageBody()
    data: CreateReactionDto,
  ) {
    const reactionMessage = await this.messagesService.reaction(
      data.messageId,
      data.emoji,
      user.id,
    );
    const roomName = `channel_${data.channelId}`;
    this.server.to(roomName).emit('reactionAdded', reactionMessage);

    return reactionMessage;
  }

  @SubscribeMessage('deleteMessage')
  async remove(
    @WsUser() user: any,
    @MessageBody() data: { messageId: number; channelId: number },
  ) {
    const result = await this.messagesService.remove(data.messageId, user.id);
    const roomName = `channel_${data.channelId}`;
    this.server
      .to(roomName)
      .emit('messageDeleted', { messageId: data.messageId });
    return result;
  }
}
