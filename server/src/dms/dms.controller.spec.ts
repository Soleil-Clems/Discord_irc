import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DmsController } from './dms.controller';
import { DmsService, FileCategory } from './dms.service';

const mockDmsService = {
  uploadSingleFile: jest.fn(),
  getFileUrl: jest.fn(),
  getSignedUrl: jest.fn(),
};

describe('DmsController', () => {
  let controller: DmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DmsController],
      providers: [{ provide: DmsService, useValue: mockDmsService }],
    }).compile();

    controller = module.get<DmsController>(DmsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  describe('upload', () => {
    const makeFile = (name: string, size = 1024): Express.Multer.File =>
      ({ originalname: name, size, buffer: Buffer.from('x'), mimetype: 'image/png' } as any);

    it('upload une image et délègue à dmsService.uploadSingleFile', async () => {
      mockDmsService.uploadSingleFile.mockResolvedValue({ url: 'u', key: 'k' });
      const file = makeFile('photo.png');
      await controller.upload(file, 'img');
      expect(mockDmsService.uploadSingleFile).toHaveBeenCalledWith({
        file,
        category: FileCategory.Image,
      });
    });

    it('upload un fichier voice', async () => {
      mockDmsService.uploadSingleFile.mockResolvedValue({ url: 'u', key: 'k' });
      const file = makeFile('audio.mp3');
      await controller.upload(file, 'voice');
      expect(mockDmsService.uploadSingleFile).toHaveBeenCalledWith({
        file,
        category: FileCategory.Voice,
      });
    });

    it('lève BadRequestException si type de fichier non autorisé', async () => {
      const file = makeFile('virus.exe');
      await expect(controller.upload(file, 'img')).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si fichier trop grand', async () => {
      const file = makeFile('big.png', 100 * 1024 * 1024);
      await expect(controller.upload(file, 'img')).rejects.toThrow(BadRequestException);
    });

    it('utilise la catégorie file par défaut si catégorie inconnue', async () => {
      mockDmsService.uploadSingleFile.mockResolvedValue({ url: 'u', key: 'k' });
      const file = makeFile('doc.pdf');
      await controller.upload(file, undefined);
      expect(mockDmsService.uploadSingleFile).toHaveBeenCalledWith({
        file,
        category: FileCategory.File,
      });
    });
  });

  describe('getFileUrl', () => {
    it('retourne le résultat de dmsService.getFileUrl', () => {
      mockDmsService.getFileUrl.mockReturnValue({ url: 'http://cdn/key' });
      const result = controller.getFileUrl('my-key');
      expect(result).toEqual({ url: 'http://cdn/key' });
      expect(mockDmsService.getFileUrl).toHaveBeenCalledWith('my-key');
    });
  });

  describe('getSignedUrl', () => {
    it('retourne une URL signée', async () => {
      mockDmsService.getSignedUrl.mockResolvedValue({ url: 'https://signed' });
      const result = await controller.getSignedUrl('my-key');
      expect(result).toEqual({ url: 'https://signed' });
      expect(mockDmsService.getSignedUrl).toHaveBeenCalledWith('my-key');
    });
  });
});
