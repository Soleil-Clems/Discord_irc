import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { Users } from '../users/entities/users.entity';
import { RefreshToken } from './entities/refresh-token.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-token'),
  compare: jest.fn(),
}));
jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-uuid-token') }));

import * as bcrypt from 'bcrypt';

const mockRepo = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
  verifyAsync: jest.fn(),
};

const mockUser = () => ({
  id: 1,
  email: 'user@test.com',
  username: 'testuser',
  password: 'hashed-pass',
  lastSeen: new Date(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockRepo>;
  let tokenRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(Users), useFactory: mockRepo },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(Users));
    tokenRepo = module.get(getRepositoryToken(RefreshToken));
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('retourne null si utilisateur non trouvé', async () => {
      userRepo.findOne.mockResolvedValue(undefined);
      const result = await service.validateUser('x@x.com', 'pass');
      expect(result).toBeNull();
    });

    it('retourne null si mot de passe incorrect', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser('user@test.com', 'wrong');
      expect(result).toBeNull();
    });

    it('retourne le user sans password si credentials valides', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser('user@test.com', 'correct');
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('generateAccessToken', () => {
    it('appelle jwtService.sign et retourne le token', () => {
      const user = { id: 1, email: 'u@u.com', username: 'u' } as any;
      const result = service.generateAccessToken(user);
      expect(result).toBe('mock-access-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('crée, sauvegarde et retourne le token UUID', async () => {
      tokenRepo.create.mockReturnValue({
        tokenHash: 'hashed-token',
        userId: 1,
      });
      tokenRepo.save.mockResolvedValue({});
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.generateRefreshToken(1);
      expect(result).toBe('test-uuid-token');
      expect(tokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
      );
      expect(tokenRepo.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('lève Error si utilisateur non trouvé', async () => {
      userRepo.findOneBy.mockResolvedValue(undefined);
      await expect(service.login({ id: 99 } as any)).rejects.toThrow(
        'User not found',
      );
    });

    it('retourne TokenResponseDto avec access_token, refresh_token, expires_in', async () => {
      const user = mockUser();
      userRepo.findOneBy.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);
      tokenRepo.create.mockReturnValue({});
      tokenRepo.save.mockResolvedValue({});

      const result = await service.login({
        id: 1,
        email: 'u@u.com',
        username: 'u',
      } as any);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.expires_in).toBe(300);
    });
  });

  describe('refreshTokens', () => {
    it('lève UnauthorizedException si aucun token ne correspond', async () => {
      tokenRepo.find.mockResolvedValue([]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lève UnauthorizedException si token expiré et le révoque', async () => {
      const expiredToken = {
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 1000),
        isRevoked: false,
        user: mockUser(),
      };
      tokenRepo.find.mockResolvedValue([expiredToken]);
      tokenRepo.save.mockResolvedValue({});
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(expiredToken.isRevoked).toBe(true);
    });

    it('retourne TokenResponseDto si token valide', async () => {
      const validToken = {
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 100000),
        isRevoked: false,
        user: mockUser(),
      };
      tokenRepo.find.mockResolvedValue([validToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens('valid-token');
      expect(result).toHaveProperty('access_token');
      expect(result.refresh_token).toBe('valid-token');
      expect(result.expires_in).toBe(300);
    });
  });

  describe('logout', () => {
    it('révoque le token correspondant et retourne message', async () => {
      const token = { tokenHash: 'hash', isRevoked: false };
      tokenRepo.find.mockResolvedValue([token]);
      tokenRepo.save.mockResolvedValue({});
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.logout(1, 'refresh-val');
      expect(result.message).toBe('Déconnexion réussie');
      expect(token.isRevoked).toBe(true);
    });

    it('retourne message sans action si refreshToken non fourni', async () => {
      const result = await service.logout(1);
      expect(result.message).toBe('Déconnexion réussie');
      expect(tokenRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('révoque tous les tokens et retourne message', async () => {
      tokenRepo.update.mockResolvedValue({ affected: 2 });
      const result = await service.logoutAll(1);
      expect(result.message).toContain('Déconnexion de tous les appareils');
      expect(tokenRepo.update).toHaveBeenCalledWith(
        { userId: 1, isRevoked: false },
        { isRevoked: true },
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('supprime les tokens expirés et retourne le nombre affecté', async () => {
      tokenRepo.delete.mockResolvedValue({ affected: 3 });
      const result = await service.cleanupExpiredTokens();
      expect(result).toBe(3);
      expect(tokenRepo.delete).toHaveBeenCalled();
    });

    it('retourne 0 si aucun token supprimé', async () => {
      tokenRepo.delete.mockResolvedValue({ affected: undefined });
      const result = await service.cleanupExpiredTokens();
      expect(result).toBe(0);
    });
  });
});
