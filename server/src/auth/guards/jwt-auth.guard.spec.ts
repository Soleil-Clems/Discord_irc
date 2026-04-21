import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const buildCtx = () =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    }) as any;

  it('retourne true si la route est publique', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(buildCtx())).toBe(true);
  });

  it('délègue au parent si non publique', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const guard = new JwtAuthGuard(reflector);
    const spy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue('delegated' as any);
    expect(guard.canActivate(buildCtx())).toBe('delegated');
    spy.mockRestore();
  });
});
