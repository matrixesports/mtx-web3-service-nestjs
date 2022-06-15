import { Test, TestingModule } from '@nestjs/testing';
import { LootboxResolver } from './lootbox.resolver';

describe('LootboxResolver', () => {
  let resolver: LootboxResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LootboxResolver],
    }).compile();

    resolver = module.get<LootboxResolver>(LootboxResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
