import { Test, TestingModule } from '@nestjs/testing';
import { LootboxService } from './lootbox.service';

describe('LootboxService', () => {
  let service: LootboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LootboxService],
    }).compile();

    service = module.get<LootboxService>(LootboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
