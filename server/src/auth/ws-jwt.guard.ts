import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { jwtConstants } from './constant';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token = client.handshake.auth.token;

    if (!token) {
      throw new WsException('No token provided');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // Attache le user au client socket pour pouvoir le récupérer plus tard
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      client.data.user = payload;

      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }
}
