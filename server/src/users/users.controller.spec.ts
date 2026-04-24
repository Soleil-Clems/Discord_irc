import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DmsService, FileCategory } from '@/dms/dms.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let dmsService: jest.Mocked<Partial<DmsService>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      search: jest.fn(),
      findOneByEmail: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getPublicProfile: jest.fn(),
    };
    dmsService = {
      uploadSingleFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: DmsService, useValue: dmsService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create délègue au service', async () => {
    (usersService.create as jest.Mock).mockResolvedValue({ id: 1 });
    await controller.create({ email: 'a@b.c', password: 'pw' } as any);
    expect(usersService.create).toHaveBeenCalled();
  });

  it('search passe q au service', async () => {
    (usersService.search as jest.Mock).mockResolvedValue([]);
    await controller.search('jo');
    expect(usersService.search).toHaveBeenCalledWith('jo');
  });

  it('search avec q vide passe une string vide', async () => {
    (usersService.search as jest.Mock).mockResolvedValue([]);
    await controller.search(undefined as any);
    expect(usersService.search).toHaveBeenCalledWith('');
  });

  it('findByEmail délègue au service', () => {
    (usersService.findOneByEmail as jest.Mock).mockReturnValue('u');
    const result = controller.findByEmail({ email: 'a@b.c' } as any);
    expect(usersService.findOneByEmail).toHaveBeenCalledWith('a@b.c');
    expect(result).toBe('u');
  });

  it('findAll délègue au service', async () => {
    (usersService.findAll as jest.Mock).mockResolvedValue([]);
    await controller.findAll();
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('findOne délègue avec id parsé', async () => {
    (usersService.findOne as jest.Mock).mockResolvedValue({ id: 1 });
    await controller.findOne(1);
    expect(usersService.findOne).toHaveBeenCalledWith(1);
  });

  it('update retourne undefined si body vide', async () => {
    const result = await controller.update(1, {} as any);
    expect(result).toBeUndefined();
    expect(usersService.update).not.toHaveBeenCalled();
  });

  it('update appelle le service avec un body non vide', async () => {
    (usersService.update as jest.Mock).mockResolvedValue({ id: 1 });
    await controller.update(1, { username: 'x' } as any);
    expect(usersService.update).toHaveBeenCalledWith(1, { username: 'x' });
  });

  it('remove délègue au service', async () => {
    (usersService.remove as jest.Mock).mockResolvedValue({ error: false });
    await controller.remove('3');
    expect(usersService.remove).toHaveBeenCalledWith(3);
  });

  it('updatePicture upload et met à jour le user', async () => {
    (dmsService.uploadSingleFile as jest.Mock).mockResolvedValue({
      url: 'http://img',
    });
    (usersService.update as jest.Mock).mockResolvedValue({ id: 1 });

    const file = { mimetype: 'image/png', size: 100 } as any;
    await controller.updatePicture(1, file);

    expect(dmsService.uploadSingleFile).toHaveBeenCalledWith({
      file,
      category: FileCategory.Image,
    });
    expect(usersService.update).toHaveBeenCalledWith(1, { img: 'http://img' });
  });

  it('getPublicProfile délègue au service', async () => {
    (usersService.getPublicProfile as jest.Mock).mockResolvedValue({
      id: 1,
    });
    await controller.getPublicProfile(1);
    expect(usersService.getPublicProfile).toHaveBeenCalledWith(1);
  });
});
