import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DmsService, FileCategory } from './dms.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url'),
}));

const configValues: Record<string, string> = {
  S3_ACCESS_KEY: 'access',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_ENDPOINT: 'https://endpoint/',
  S3_BUCKET_NAME: 'bucket',
  S3_REGION: 'auto',
  S3_PUBLIC_DOMAIN: '',
};

const mockConfigService = {
  get: jest.fn((key: string) => configValues[key] ?? ''),
  getOrThrow: jest.fn((key: string) => configValues[key] ?? ''),
};

describe('DmsService', () => {
  let service: DmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DmsService>(DmsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(service).toBeDefined());

  describe('getFileUrl', () => {
    it('retourne url avec endpoint/bucket/key si pas de publicDomain', () => {
      const result = service.getFileUrl('my-key');
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('my-key');
    });
  });

  describe('uploadSingleFile', () => {
    it('upload et retourne les métadonnées du fichier', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      // Recréer l'instance avec le mock send
      const freshService = new (DmsService as any)(mockConfigService);
      freshService['client'] = { send: mockSend };

      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        originalname: 'test.png',
        size: 4,
      } as Express.Multer.File;

      const result = await freshService.uploadSingleFile({
        file,
        category: FileCategory.Image,
      });
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
    });
  });

  describe('getSignedUrl', () => {
    it('retourne une URL signée', async () => {
      const result = await service.getSignedUrl('test-key');
      expect(result).toHaveProperty('url', 'https://signed-url');
    });
  });

  describe('deleteFile', () => {
    it('supprime et retourne { success: true }', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (service as any).client = { send: mockSend };

      const result = await service.deleteFile('test-key');
      expect(result).toEqual({ success: true, key: 'test-key' });
    });

    it('lève InternalServerErrorException si erreur', async () => {
      (service as any).client = {
        send: jest.fn().mockRejectedValue(new Error('S3 error')),
      };
      await expect(service.deleteFile('bad-key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
