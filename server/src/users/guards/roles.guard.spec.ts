import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/roles.enum';

const buildContext = (user: any): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('retourne true si aucun rôle requis', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(buildContext({ role: Role.User }))).toBe(true);
  });

  it('retourne true si user a le bon rôle', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(buildContext({ role: Role.Admin }))).toBe(true);
  });

  it('retourne false si user n a pas le rôle requis', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(buildContext({ role: Role.User }))).toBe(false);
  });

  it('supporte plusieurs rôles acceptés', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.Admin, Role.User]);
    expect(guard.canActivate(buildContext({ role: Role.User }))).toBe(true);
  });
});
