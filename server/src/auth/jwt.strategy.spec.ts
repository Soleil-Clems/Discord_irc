import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy();

  it('retourne le payload tel quel', () => {
    const payload = { id: 1, email: 'a@b.c' } as any;
    expect(strategy.validate(payload)).toEqual(payload);
  });
});
