export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  expiresIn: process.env.JWT_EXPIRES_IN || 60,
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '5m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  refreshTokenExpiresInMs: 7 * 24 * 60 * 60 * 1000,
};
