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
  server: {
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    emit: jest.fn(),
  },
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

  it('update délègue au service', async () => {
    mockServersService.update.mockResolvedValue({ id: 1 });
    await controller.update(req(), 1, { name: 'N' } as any);
    expect(mockServersService.update).toHaveBeenCalledWith(1, { name: 'N' }, 1);
  });

  it('changeRole met à jour et émet memberRoleChanged', async () => {
    mockServersService.changeMemberRole.mockResolvedValue({ ok: true });
    const emit = jest.fn();
    mockGateway.server.emit = emit as any;
    const result = await controller.changeRole(req(), 1, {
      memberId: 2,
      role: 'admin',
    } as any);
    expect(result).toEqual({ ok: true });
    expect(emit).toHaveBeenCalledWith('memberRoleChanged', {
      serverId: 1,
      memberId: 2,
      role: 'admin',
    });
  });

  it('transferOwnership délègue et émet memberRoleChanged', async () => {
    mockServersService.transferOwnership.mockResolvedValue({ ok: true });
    const emit = jest.fn();
    mockGateway.server.emit = emit as any;
    await controller.transferOwnership(req(), 1, { newOwnerId: 9 } as any);
    expect(mockServersService.transferOwnership).toHaveBeenCalledWith(1, 1, 9);
    expect(emit).toHaveBeenCalled();
  });

  it('getMembers délègue au service', () => {
    mockServersService.getMembers.mockReturnValue([] as any);
    controller.getMembers(req(), 1, { limit: 20 } as any);
    expect(mockServersService.getMembers).toHaveBeenCalledWith(1, 1, {
      limit: 20,
    });
  });

  it('leave délègue au service', () => {
    mockServersService.leaveServer.mockReturnValue({} as any);
    controller.leave(req(), 1, { newOwnerId: 4 } as any);
    expect(mockServersService.leaveServer).toHaveBeenCalledWith(1, 1, 4);
  });

  it('createInvitation délègue au service', () => {
    mockServersService.createInvitation.mockReturnValue({} as any);
    controller.createInvitation(req(), 1, { maxUses: 5 } as any);
    expect(mockServersService.createInvitation).toHaveBeenCalledWith(1, 1, {
      maxUses: 5,
    });
  });

  it('getInvitations délègue au service', () => {
    mockServersService.getServerInvitations.mockReturnValue([] as any);
    controller.getInvitations(req(), 1);
    expect(mockServersService.getServerInvitations).toHaveBeenCalledWith(1, 1);
  });

  it('deleteInvitation délègue au service', () => {
    mockServersService.deleteInvitation.mockReturnValue({} as any);
    controller.deleteInvitation(req(), 1, 7);
    expect(mockServersService.deleteInvitation).toHaveBeenCalledWith(1, 7, 1);
  });

  it('banUser délègue et émet memberBanned', async () => {
    mockServersService.banUser.mockResolvedValue({ ok: true });
    const emit = jest.fn();
    mockGateway.server.emit = emit as any;
    await controller.banUser(req(), 1, {
      userId: 3,
      reason: 'spam',
      durationHours: 24,
    } as any);
    expect(mockServersService.banUser).toHaveBeenCalledWith(
      1,
      1,
      3,
      'spam',
      24,
    );
    expect(emit).toHaveBeenCalledWith('memberBanned', {
      serverId: 1,
      userId: 3,
    });
  });

  it('unbanUser délègue au service', () => {
    mockServersService.unbanUser.mockReturnValue({} as any);
    controller.unbanUser(req(), 1, 3);
    expect(mockServersService.unbanUser).toHaveBeenCalledWith(1, 1, 3);
  });

  it('getBannedUsers délègue au service', () => {
    mockServersService.getBannedUsers.mockReturnValue([] as any);
    controller.getBannedUsers(req(), 1);
    expect(mockServersService.getBannedUsers).toHaveBeenCalledWith(1, 1);
  });
});
