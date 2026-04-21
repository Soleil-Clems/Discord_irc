import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsService } from './channels.service';
import { JwtService } from '@nestjs/jwt';

const mockChannelsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ChannelsGateway', () => {
  let gateway: ChannelsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsGateway,
        { provide: ChannelsService, useValue: mockChannelsService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    gateway = module.get<ChannelsGateway>(ChannelsGateway);
  });

  it('is defined', () => expect(gateway).toBeDefined());
});
