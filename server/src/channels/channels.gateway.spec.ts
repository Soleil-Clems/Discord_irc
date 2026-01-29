import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsGateway } from './channels.gateway';
import { ChannelsService } from './channels.service';

describe('ChannelsGateway', () => {
  let gateway: ChannelsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelsGateway, ChannelsService],
    }).compile();

    gateway = module.get<ChannelsGateway>(ChannelsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
