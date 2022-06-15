import { Test, TestingModule } from '@nestjs/testing';
import { RedeemableResolver } from './redeemable.resolver';

describe('RedeemableResolver', () => {
  let resolver: RedeemableResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedeemableResolver],
    }).compile();

    resolver = module.get<RedeemableResolver>(RedeemableResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
