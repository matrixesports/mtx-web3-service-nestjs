import { Test, TestingModule } from '@nestjs/testing';
import { PremUserService } from './prem-user.service';

describe('PremUserService', () => {
  let service: PremUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremUserService],
    }).compile();

    service = module.get<PremUserService>(PremUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
