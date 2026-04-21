import { Test, TestingModule } from '@nestjs/testing';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { ServersGateway } from './servers.gateway';

const mockServersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  getMembers: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  joinServer: jest.fn(),
  leaveServer: jest.fn(),
  changeMemberRole: jest.fn(),
  transferOwnership: jest.fn(),
  createInvitation: jest.fn(),
  getServerInvitations: jest.fn(),
  deleteInvitation: jest.fn(),
  previewByCode: jest.fn(),
  joinByCode: jest.fn(),
  banUser: jest.fn(),
  unbanUser: jest.fn(),
  getBannedUsers: jest.fn(),
};

const mockGateway = {
  server: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
  emitServerUpdate: jest.fn(),
};

const req = (id = 1) => ({ user: { id } });

describe('ServersController', () => {
  let controller: ServersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServersController],
      providers: [
        { provide: ServersService, useValue: mockServersService },
        { provide: ServersGateway, useValue: mockGateway },
      ],
    }).compile();

    controller = module.get<ServersController>(ServersController);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  it('create délègue à serversService.create', async () => {
    mockServersService.create.mockResolvedValue({ id: 1 });
    await controller.create(req(), { name: 'Test' } as any);
    expect(mockServersService.create).toHaveBeenCalledWith({ name: 'Test' }, 1);
  });

  it('findAll délègue à serversService.findAll', async () => {
    mockServersService.findAll.mockResolvedValue([]);
    await controller.findAll(req());
    expect(mockServersService.findAll).toHaveBeenCalledWith(1);
  });

  it('findOne délègue à serversService.findOne', async () => {
    mockServersService.findOne.mockResolvedValue({ id: 1 });
    await controller.findOne(req(), 1);
    expect(mockServersService.findOne).toHaveBeenCalledWith(1, 1);
  });

  it('previewInvite délègue à serversService.previewByCode', async () => {
    mockServersService.previewByCode.mockResolvedValue({});
    await controller.previewInvite('abc123');
    expect(mockServersService.previewByCode).toHaveBeenCalledWith('abc123');
  });

  it('joinByCode délègue à serversService.joinByCode', async () => {
    mockServersService.joinByCode.mockResolvedValue({});
    await controller.joinByCode(req(), 'abc123');
    expect(mockServersService.joinByCode).toHaveBeenCalledWith('abc123', 1);
  });

  it('remove délègue à serversService.remove', async () => {
    mockServersService.remove.mockResolvedValue({ success: true });
    await controller.remove(req(), 1);
    expect(mockServersService.remove).toHaveBeenCalledWith(1, 1);
  });

  it('join délègue à serversService.joinServer', async () => {
    mockServersService.joinServer.mockResolvedValue({});
    controller.join(req(), 1);
    expect(mockServersService.joinServer).toHaveBeenCalledWith(1, 1);
  });
});
