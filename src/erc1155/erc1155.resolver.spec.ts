import { Test, TestingModule } from '@nestjs/testing';
import { Erc1155Resolver } from './erc1155.resolver';

describe('Erc1155Resolver', () => {
  let resolver: Erc1155Resolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Erc1155Resolver],
    }).compile();

    resolver = module.get<Erc1155Resolver>(Erc1155Resolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
