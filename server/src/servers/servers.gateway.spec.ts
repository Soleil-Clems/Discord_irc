import { Test, TestingModule } from '@nestjs/testing';
import { ServersGateway } from './servers.gateway';
import { ServersService } from './servers.service';
import { JwtService } from '@nestjs/jwt';

const mockServersService = {
  findAll: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
};

describe('ServersGateway', () => {
  let gateway: ServersGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersGateway,
        { provide: ServersService, useValue: mockServersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<ServersGateway>(ServersGateway);
  });

  afterEach(() => jest.clearAllMocks());

  it('is defined', () => expect(gateway).toBeDefined());
});
