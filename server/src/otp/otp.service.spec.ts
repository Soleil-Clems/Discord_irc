import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { OtpCode } from './entities/otp-code.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-code'),
  compare: jest.fn(),
}));
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomInt: jest.fn().mockReturnValue(123456),
}));

const sendMail = jest.fn().mockResolvedValue(undefined);
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail })),
}));

const resendSend = jest.fn().mockResolvedValue(undefined);
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: resendSend },
  })),
}));

import * as bcrypt from 'bcrypt';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const buildConfig = (env: Record<string, string>) =>
  ({
    get: jest.fn((key: string) => env[key]),
  }) as unknown as ConfigService;

describe('OtpService', () => {
  let service: OtpService;
  let repo: ReturnType<typeof mockRepo>;

  const setup = async (prod = false) => {
    const env = prod
      ? {
          NODE_ENV: 'production',
          RESEND_API_KEY: 'k',
          RESEND_FROM_EMAIL: 'f@x',
        }
      : {
          NODE_ENV: 'development',
          MAIL_HOST: 'h',
          MAIL_PORT: '2525',
          MAIL_USER: 'u',
          MAIL_PASS: 'p',
        };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: getRepositoryToken(OtpCode), useFactory: mockRepo },
        { provide: ConfigService, useValue: buildConfig(env) },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    repo = module.get(getRepositoryToken(OtpCode));
  };

  afterEach(() => jest.clearAllMocks());

  describe('dev mode', () => {
    beforeEach(async () => setup(false));

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('generateOtp retourne false si un OTP a été envoyé récemment', async () => {
      repo.findOne.mockResolvedValue({
        createdAt: new Date(Date.now() - 10_000),
      });
      const result = await service.generateOtp(1, 'u@test.com');
      expect(result).toBe(false);
    });

    it('generateOtp génère et envoie un OTP', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.save.mockResolvedValue({});
      repo.update.mockResolvedValue({});

      const result = await service.generateOtp(1, 'u@test.com');
      expect(result).toBe(true);
      expect(repo.save).toHaveBeenCalled();
      expect(sendMail).toHaveBeenCalled();
    });

    it('generateOtp invalide les anciens OTPs avant d en créer un nouveau', async () => {
      repo.findOne.mockResolvedValue({
        createdAt: new Date(Date.now() - 120_000),
      });
      repo.save.mockResolvedValue({});
      repo.update.mockResolvedValue({});

      await service.generateOtp(1, 'u@test.com');
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 1, isUsed: false },
        { isUsed: true },
      );
    });

    it('verifyOtp retourne false si aucun OTP actif', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.verifyOtp(1, '123456')).resolves.toBe(false);
    });

    it('verifyOtp retourne false si le code ne matche pas', async () => {
      repo.findOne.mockResolvedValue({ code: 'hash', isUsed: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.verifyOtp(1, 'wrong')).resolves.toBe(false);
    });

    it('verifyOtp marque comme utilisé et retourne true si correct', async () => {
      const otp: any = { code: 'hash', isUsed: false };
      repo.findOne.mockResolvedValue(otp);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repo.save.mockResolvedValue(otp);

      await expect(service.verifyOtp(1, 'good')).resolves.toBe(true);
      expect(otp.isUsed).toBe(true);
      expect(repo.save).toHaveBeenCalledWith(otp);
    });

    it('invalidateUserOtps met à jour tous les OTPs actifs', async () => {
      repo.update.mockResolvedValue({});
      await service.invalidateUserOtps(42);
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 42, isUsed: false },
        { isUsed: true },
      );
    });

    it('cleanupExpiredOtps retourne le nombre supprimé', async () => {
      repo.delete.mockResolvedValue({ affected: 3 });
      await expect(service.cleanupExpiredOtps()).resolves.toBe(3);
    });

    it('cleanupExpiredOtps retourne 0 si affected est absent', async () => {
      repo.delete.mockResolvedValue({});
      await expect(service.cleanupExpiredOtps()).resolves.toBe(0);
    });
  });

  describe('prod mode', () => {
    beforeEach(async () => setup(true));

    it('envoie un OTP via resend en prod', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.save.mockResolvedValue({});
      repo.update.mockResolvedValue({});

      const result = await service.generateOtp(1, 'u@test.com');
      expect(result).toBe(true);
      expect(resendSend).toHaveBeenCalled();
    });
  });
});
