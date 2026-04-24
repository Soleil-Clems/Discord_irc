import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OtpService } from '@/otp/otp.service';

const mockAuthService = {
  login: jest.fn().mockResolvedValue({
    access_token: 'tok',
    refresh_token: 'ref',
    expires_in: 300,
    user: { id: 1 },
  }),
  refreshTokens: jest.fn().mockResolvedValue({
    access_token: 'tok',
    expires_in: 300,
    user: { id: 1 },
  }),
  logout: jest.fn().mockResolvedValue({ message: 'Déconnexion réussie' }),
  logoutAll: jest.fn().mockResolvedValue({
    message: 'Déconnexion de tous les appareils réussie',
  }),
};

const mockUsersService = {
  findOne: jest.fn().mockResolvedValue({ id: 1, username: 'u' }),
};

const mockOtpService = {
  generateAndSend: jest.fn(),
  verify: jest.fn(),
  resend: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  describe('login', () => {
    it('appelle authService.login et set le cookie', async () => {
      const req = { user: { id: 1 } };
      const res = { cookie: jest.fn() };
      const result = await controller.login(req as any, res as any);
      expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'ref',
        expect.any(Object),
      );
      expect(result).toHaveProperty('access_token');
      expect(result).not.toHaveProperty('refresh_token');
    });
  });

  describe('refresh', () => {
    it('retourne 401 si refresh_token absent', async () => {
      const req = { cookies: {} };
      const result = await controller.refresh(req as any);
      expect(result).toEqual({
        message: 'Refresh token manquant',
        statusCode: 401,
      });
    });

    it('appelle authService.refreshTokens si token présent', async () => {
      const req = { cookies: { refresh_token: 'old-ref' } };
      const result = await controller.refresh(req as any);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('old-ref');
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('logout', () => {
    it('clear le cookie et appelle authService.logout', async () => {
      const req = { user: { id: 1 }, cookies: { refresh_token: 'ref' } };
      const res = { clearCookie: jest.fn() };
      const dto = { refresh_token: undefined };
      await controller.logout(req as any, dto as any, res as any);
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(mockAuthService.logout).toHaveBeenCalledWith(1, 'ref');
    });
  });

  describe('logoutAll', () => {
    it('clear le cookie et appelle authService.logoutAll', async () => {
      const req = { user: { id: 1 } };
      const res = { clearCookie: jest.fn() };
      await controller.logoutAll(req as any, res as any);
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(1);
    });
  });

  describe('getProfile', () => {
    it('appelle usersService.findOne avec req.user.id', async () => {
      const req = { user: { id: 5 } };
      await controller.getProfile(req as any);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(5);
    });
  });
});
