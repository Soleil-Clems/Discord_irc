import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

const mockChannelsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ChannelsController', () => {
  let controller: ChannelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [{ provide: ChannelsService, useValue: mockChannelsService }],
    }).compile();

    controller = module.get<ChannelsController>(ChannelsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(controller).toBeDefined());

  it('create délègue à channelsService.create', async () => {
    mockChannelsService.create.mockResolvedValue({ id: 1 });
    const req = { user: { id: 1 } };
    await controller.create(req as any, { serverId: 1, name: 'general' } as any);
    expect(mockChannelsService.create).toHaveBeenCalledWith({ serverId: 1, name: 'general' }, 1);
  });

  it('findAll délègue à channelsService.findAll', async () => {
    mockChannelsService.findAll.mockResolvedValue([]);
    await controller.findAll(1);
    expect(mockChannelsService.findAll).toHaveBeenCalledWith(1);
  });

  it('findOne délègue à channelsService.findOne', async () => {
    mockChannelsService.findOne.mockResolvedValue({ id: 1 });
    await controller.findOne(1);
    expect(mockChannelsService.findOne).toHaveBeenCalledWith(1);
  });

  it('update délègue à channelsService.update', async () => {
    mockChannelsService.update.mockResolvedValue({ id: 1 });
    const req = { user: { id: 1 } };
    await controller.update(req as any, 1, { name: 'new' } as any);
    expect(mockChannelsService.update).toHaveBeenCalledWith(1, { name: 'new' }, 1);
  });

  it('remove délègue à channelsService.remove', async () => {
    mockChannelsService.remove.mockResolvedValue({ success: true });
    const req = { user: { id: 1 } };
    await controller.remove(req as any, 1);
    expect(mockChannelsService.remove).toHaveBeenCalledWith(1, 1);
  });
});
