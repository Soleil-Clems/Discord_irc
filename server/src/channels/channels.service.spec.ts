import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelsService } from './channels.service';
import { Channel } from './entities/channel.entity';
import { Server } from '../servers/entities/server.entity';
import { ServerMember } from '../servers/entities/server-member.entity';
import { ServerRole } from '../servers/enums/server-role.enum';
import { ChannelType } from './enums/channel-type.enum';

const mockRepo = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
});

describe('ChannelsService', () => {
  let service: ChannelsService;
  let channelRepo: ReturnType<typeof mockRepo>;
  let serverRepo: ReturnType<typeof mockRepo>;
  let memberRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: getRepositoryToken(Channel), useFactory: mockRepo },
        { provide: getRepositoryToken(Server), useFactory: mockRepo },
        { provide: getRepositoryToken(ServerMember), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    channelRepo = module.get(getRepositoryToken(Channel));
    serverRepo = module.get(getRepositoryToken(Server));
    memberRepo = module.get(getRepositoryToken(ServerMember));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = { serverId: 1, name: 'general', type: ChannelType.Text };

    it('lève NotFoundException si serveur non trouvé', async () => {
      serverRepo.findOneBy.mockResolvedValue(undefined);
      await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si user non Admin/Owner', async () => {
      serverRepo.findOneBy.mockResolvedValue({ id: 1 });
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });
      await expect(service.create(dto, 1)).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si user non membre', async () => {
      serverRepo.findOneBy.mockResolvedValue({ id: 1 });
      memberRepo.findOne.mockResolvedValue(undefined);
      await expect(service.create(dto, 1)).rejects.toThrow(ForbiddenException);
    });

    it('crée et retourne le channel si Owner', async () => {
      const server = { id: 1 };
      const channel = { id: 1, name: 'general' };
      serverRepo.findOneBy.mockResolvedValue(server);
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      channelRepo.create.mockReturnValue(channel);
      channelRepo.save.mockResolvedValue(channel);

      const result = await service.create(dto, 1);
      expect(result).toEqual(channel);
    });

    it('crée et retourne le channel si Admin', async () => {
      const server = { id: 1 };
      const channel = { id: 1, name: 'general' };
      serverRepo.findOneBy.mockResolvedValue(server);
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Admin });
      channelRepo.create.mockReturnValue(channel);
      channelRepo.save.mockResolvedValue(channel);

      const result = await service.create(dto, 1);
      expect(result).toEqual(channel);
    });
  });

  describe('findAll', () => {
    it('retourne les serveurs avec channels', async () => {
      const servers = [{ id: 1, channels: [{ id: 1 }] }];
      serverRepo.find.mockResolvedValue(servers);
      const result = await service.findAll(1);
      expect(result).toEqual(servers);
    });
  });

  describe('findOne', () => {
    it('retourne le channel', async () => {
      const channel = { id: 1, name: 'general', server: { id: 1 } };
      channelRepo.findOne.mockResolvedValue(channel);
      const result = await service.findOne(1);
      expect(result).toEqual(channel);
    });

    it('lève NotFoundException si channel non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue(undefined);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('lève NotFoundException si channel non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue(undefined);
      await expect(
        service.update(1, { name: 'new' } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si permissions insuffisantes', async () => {
      channelRepo.findOne.mockResolvedValue({ id: 1, server: { id: 1 } });
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });
      await expect(
        service.update(1, { name: 'new' } as any, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('met à jour et retourne le channel', async () => {
      const channel = { id: 1, name: 'old', server: { id: 1 } };
      const updated = { ...channel, name: 'new' };
      channelRepo.findOne.mockResolvedValue(channel);
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      channelRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'new' } as any, 1);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('lève NotFoundException si channel non trouvé', async () => {
      channelRepo.findOne.mockResolvedValue(undefined);
      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si permissions insuffisantes', async () => {
      channelRepo.findOne.mockResolvedValue({ id: 1, server: { id: 1 } });
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Member });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('supprime et retourne { success: true }', async () => {
      channelRepo.findOne.mockResolvedValue({ id: 1, server: { id: 1 } });
      memberRepo.findOne.mockResolvedValue({ role: ServerRole.Owner });
      channelRepo.remove.mockResolvedValue({});

      const result = await service.remove(1, 1);
      expect(result).toEqual({ success: true });
    });
  });
});
