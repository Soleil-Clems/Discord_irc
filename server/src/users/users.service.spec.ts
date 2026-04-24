import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Users } from './entities/users.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pass'),
}));

import * as bcrypt from 'bcrypt';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockUser = () =>
  ({
    id: 1,
    email: 'user@test.com',
    username: 'testuser',
    password: 'hashed-pass',
  }) as unknown as Users;

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Users), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(Users));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      email: 'u@test.com',
      password: 'pw',
      username: 'u',
    } as any;

    it('hash le mot de passe et sauvegarde', async () => {
      const saved = mockUser();
      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create({ ...dto });

      expect(bcrypt.hash).toHaveBeenCalledWith('pw', expect.any(Number));
      expect(repo.create).toHaveBeenCalled();
      expect(result).toBe(saved);
    });

    it('throw ConflictException sur ER_DUP_ENTRY', async () => {
      repo.create.mockReturnValue({});
      repo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.create({ ...dto })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throw InternalServerErrorException sur autre erreur', async () => {
      repo.create.mockReturnValue({});
      repo.save.mockRejectedValue(new Error('boom'));

      await expect(service.create({ ...dto })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('retourne la liste des users', async () => {
      const list = [mockUser()];
      repo.find.mockResolvedValue(list);

      await expect(service.findAll()).resolves.toBe(list);
    });

    it('throw InternalServerErrorException si erreur', async () => {
      repo.find.mockRejectedValue(new Error('db'));
      await expect(service.findAll()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('retourne un utilisateur', async () => {
      const u = mockUser();
      repo.findOne.mockResolvedValue(u);
      await expect(service.findOne(1)).resolves.toBe(u);
    });

    it('throw NotFoundException si pas trouvé', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throw InternalServerErrorException en cas d erreur DB', async () => {
      repo.findOne.mockRejectedValue(new Error('db'));
      await expect(service.findOne(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneByEmail', () => {
    it('retourne un utilisateur', async () => {
      const u = mockUser();
      repo.findOne.mockResolvedValue(u);
      await expect(service.findOneByEmail('user@test.com')).resolves.toBe(u);
    });

    it('throw NotFoundException si pas trouvé', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOneByEmail('x@x.com')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throw InternalServerErrorException sur erreur', async () => {
      repo.findOne.mockRejectedValue(new Error('db'));
      await expect(service.findOneByEmail('x@x.com')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('met à jour et sauvegarde', async () => {
      const u = mockUser();
      repo.findOne.mockResolvedValue(u);
      repo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.update(1, { username: 'newname' } as any);

      expect(result.username).toBe('newname');
    });

    it('throw NotFoundException si user absent', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update(1, {} as any)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throw ConflictException sur ER_DUP_ENTRY', async () => {
      repo.findOne.mockResolvedValue(mockUser());
      repo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
      await expect(service.update(1, {} as any)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throw InternalServerErrorException sur autre erreur', async () => {
      repo.findOne.mockResolvedValue(mockUser());
      repo.save.mockRejectedValue(new Error('boom'));
      await expect(service.update(1, {} as any)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('search', () => {
    it('sanitize et recherche', async () => {
      const list = [mockUser()];
      repo.find.mockResolvedValue(list);

      await expect(service.search('jo%hn_')).resolves.toBe(list);
      expect(repo.find).toHaveBeenCalled();
    });

    it('throw InternalServerErrorException si erreur', async () => {
      repo.find.mockRejectedValue(new Error('db'));
      await expect(service.search('x')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getPublicProfile', () => {
    it('retourne le profil', async () => {
      const u = mockUser();
      repo.findOne.mockResolvedValue(u);
      await expect(service.getPublicProfile(1)).resolves.toBe(u);
    });

    it('throw NotFoundException si pas trouvé', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getPublicProfile(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throw InternalServerErrorException sur erreur DB', async () => {
      repo.findOne.mockRejectedValue(new Error('db'));
      await expect(service.getPublicProfile(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('remove', () => {
    it('supprime et retourne un message', async () => {
      const u = mockUser();
      repo.findOne.mockResolvedValue(u);
      repo.remove.mockResolvedValue(u);

      const result = await service.remove(1);
      expect(result).toEqual({
        message: 'Utilisateur supprimé avec succès',
        error: false,
      });
    });

    it('throw NotFoundException si user absent', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throw InternalServerErrorException sur autre erreur', async () => {
      repo.findOne.mockResolvedValue(mockUser());
      repo.remove.mockRejectedValue(new Error('boom'));
      await expect(service.remove(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
