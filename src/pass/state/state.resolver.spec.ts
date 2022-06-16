import { Test, TestingModule } from '@nestjs/testing';
import { StateResolver } from './state.resolver';

describe('StateResolver', () => {
  let resolver: StateResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateResolver],
    }).compile();

    resolver = module.get<StateResolver>(StateResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
