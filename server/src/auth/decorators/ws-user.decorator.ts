import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const WsUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const client: Socket = ctx.switchToWs().getClient();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = client.data.user;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data ? user?.[data] : user;
  },
);
