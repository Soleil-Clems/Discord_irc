import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '@/auth/constant';
import { Users } from '@/users/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConversationsService } from './conversations.service';
import { SendPrivateMessageDto } from './dto/send-private-message.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';
import { UpdatePrivateMessageDto } from './dto/update-private-message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway()
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const token = client.handshake.auth.token;

      if (!token) {
        client.disconnect();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const userId = payload.id;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      client.userId = userId;

      const isFirstSocket = !this.userSockets.has(userId);

      if (isFirstSocket) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);

      if (isFirstSocket) {
        this.server.emit('userOnline', { userId });
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.userId);
          this.server.emit('userOffline', { userId: client.userId });
        }
      }
    }
  }

  private async getUserIdFromSocket(client: Socket): Promise<number | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const token = client.handshake.auth.token;

      if (!token) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return payload.id;
    } catch {
      return null;
    }
  }

  getOnlineUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }

  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  @SubscribeMessage('getOnlineUsers')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUserIds = this.getOnlineUsers();
    return { onlineUserIds };
  }

  @SubscribeMessage('getAllUsersStatus')
  async handleGetAllUsersStatus() {
    const allUsers = await this.userRepository.find({
      select: ['id', 'username', 'img'],
    });

    const usersStatus = allUsers.map((user) => ({
      ...user,
      isOnline: this.userSockets.has(user.id),
    }));

    return { users: usersStatus };
  }

  @SubscribeMessage('sendPrivateMessage')
  async handleSendPrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendPrivateMessageDto,
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      const message = await this.conversationsService.createMessage(
        data.conversationId,
        { content: data.content, type: data.type },
        userId,
      );

      const otherUser = await this.conversationsService.getOtherUser(
        data.conversationId,
        userId,
      );

      this.server.to(`user:${otherUser.id}`).emit('newPrivateMessage', message);
      this.server.to(`user:${userId}`).emit('newPrivateMessage', message);

      return message;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      const otherUser = await this.conversationsService.getOtherUser(
        data.conversationId,
        userId,
      );

      const currentUser = await this.userRepository.findOneBy({ id: userId });
      this.server.to(`user:${otherUser.id}`).emit('userTyping', {
        conversationId: data.conversationId,
        userId,
        username: currentUser?.username,
      });

      return { success: true };
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e.message };
    }
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      const otherUser = await this.conversationsService.getOtherUser(
        data.conversationId,
        userId,
      );

      const currentUser = await this.userRepository.findOneBy({ id: userId });
      this.server.to(`user:${otherUser.id}`).emit('userStoppedTyping', {
        conversationId: data.conversationId,
        userId,
        username: currentUser?.username,
      });

      return { success: true };
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e.message };
    }
  }

  @SubscribeMessage('updatePrivateMessage')
  async handleUpdatePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: number;
      conversationId: number;
    } & UpdatePrivateMessageDto,
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      const updatedMessage = await this.conversationsService.updateMessage(
        data.messageId,
        { content: data.content },
        userId,
      );

      const otherUser = await this.conversationsService.getOtherUser(
        data.conversationId,
        userId,
      );

      this.server
        .to(`user:${otherUser.id}`)
        .emit('privateMessageUpdated', updatedMessage);
      this.server
        .to(`user:${userId}`)
        .emit('privateMessageUpdated', updatedMessage);

      return updatedMessage;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e.message };
    }
  }

  @SubscribeMessage('deletePrivateMessage')
  async handleDeletePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: number; conversationId: number },
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      const otherUser = await this.conversationsService.getOtherUser(
        data.conversationId,
        userId,
      );

      const result = await this.conversationsService.removeMessage(
        data.messageId,
        userId,
      );

      this.server.to(`user:${otherUser.id}`).emit('privateMessageDeleted', {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
      this.server.to(`user:${userId}`).emit('privateMessageDeleted', {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });

      return result;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e.message };
    }
  }
}
