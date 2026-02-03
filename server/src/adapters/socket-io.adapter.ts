// src/adapters/socket-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';

export class SocketIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: ['http://localhost:3000', process.env.FRONT_URL],
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });
    return server;
  }
}
