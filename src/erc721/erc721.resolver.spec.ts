import { Test, TestingModule } from '@nestjs/testing';
import { Erc721Resolver } from './erc721.resolver';

describe('Erc721Resolver', () => {
  let resolver: Erc721Resolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Erc721Resolver],
    }).compile();

    resolver = module.get<Erc721Resolver>(Erc721Resolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
