import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from './ws-jwt.guard';

const buildCtx = (token: string | undefined) => {
  const client: any = { handshake: { auth: { token } }, data: {} };
  return {
    switchToWs: () => ({ getClient: () => client }),
    _client: client,
  } as any;
};

describe('WsJwtGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const guard = new WsJwtGuard(jwt as any);

  afterEach(() => jest.clearAllMocks());

  it('throw si pas de token', async () => {
    const ctx = buildCtx(undefined);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(WsException);
  });

  it('throw si token invalide', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad'));
    const ctx = buildCtx('bad');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(WsException);
  });

  it('attache le payload et retourne true si valide', async () => {
    jwt.verifyAsync.mockResolvedValue({ id: 1 });
    const ctx = buildCtx('ok');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx._client.data.user).toEqual({ id: 1 });
  });
});
