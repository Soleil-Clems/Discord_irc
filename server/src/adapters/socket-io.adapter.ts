import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class SocketIoAdapter extends IoAdapter {
  private readonly configService: ConfigService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.configService = app.get(ConfigService);
  }

  createIOServer(port: number, options?: ServerOptions) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: [this.configService.get<string>('FRONT_URL')],
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return server;
  }
}
