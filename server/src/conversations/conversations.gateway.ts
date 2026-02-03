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

import { ConversationsService } from './conversations.service';
import { SendPrivateMessageDto } from './dto/send-private-message.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      const userId = payload.id;
      client.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);
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
        }
      }
    }
  }

  private async getUserIdFromSocket(client: Socket): Promise<number | null> {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      return payload.id;
    } catch {
      return null;
    }
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

      return message;
    } catch (e) {
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

      this.server.to(`user:${otherUser.id}`).emit('userTyping', {
        conversationId: data.conversationId,
        userId,
      });

      return { success: true };
    } catch (e) {
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

      this.server.to(`user:${otherUser.id}`).emit('userStoppedTyping', {
        conversationId: data.conversationId,
        userId,
      });

      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  }
}
