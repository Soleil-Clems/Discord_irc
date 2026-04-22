import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  const authService = { validateUser: jest.fn() };
  const strategy = new LocalStrategy(authService as any);

  afterEach(() => jest.clearAllMocks());

  it('retourne l utilisateur si validateUser OK', async () => {
    const user = { id: 1 };
    authService.validateUser.mockResolvedValue(user);
    await expect(strategy.validate('e', 'p')).resolves.toBe(user);
  });

  it('throw UnauthorizedException si validateUser retourne null', async () => {
    authService.validateUser.mockResolvedValue(null);
    await expect(strategy.validate('e', 'p')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
