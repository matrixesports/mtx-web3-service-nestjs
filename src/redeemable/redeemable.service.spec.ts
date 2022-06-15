import { Test, TestingModule } from '@nestjs/testing';
import { RedeemableService } from './redeemable.service';

describe('RedeemableService', () => {
  let service: RedeemableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedeemableService],
    }).compile();

    service = module.get<RedeemableService>(RedeemableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
