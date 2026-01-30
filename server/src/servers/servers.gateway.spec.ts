import { Test, TestingModule } from '@nestjs/testing';
import { ServersGateway } from './servers.gateway';
import { ServersService } from './servers.service';

describe('ServersGateway', () => {
  let gateway: ServersGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServersGateway, ServersService],
    }).compile();

    gateway = module.get<ServersGateway>(ServersGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
