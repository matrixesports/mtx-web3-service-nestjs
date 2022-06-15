import { Test, TestingModule } from '@nestjs/testing';
import { Erc20Resolver } from './erc20.resolver';

describe('Erc20Resolver', () => {
  let resolver: Erc20Resolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Erc20Resolver],
    }).compile();

    resolver = module.get<Erc20Resolver>(Erc20Resolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
