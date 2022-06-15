import { Test, TestingModule } from '@nestjs/testing';
import { ScalarResolver } from './scalar.resolver';

describe('ScalarResolver', () => {
  let resolver: ScalarResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScalarResolver],
    }).compile();

    resolver = module.get<ScalarResolver>(ScalarResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
