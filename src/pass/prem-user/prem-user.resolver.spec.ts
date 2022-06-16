import { Test, TestingModule } from '@nestjs/testing';
import { PremUserResolver } from './prem-user.resolver';

describe('PremUserResolver', () => {
  let resolver: PremUserResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremUserResolver],
    }).compile();

    resolver = module.get<PremUserResolver>(PremUserResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
