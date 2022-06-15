import { Test, TestingModule } from '@nestjs/testing';
import { Erc20Controller } from './erc20.controller';

describe('Erc20Controller', () => {
  let controller: Erc20Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Erc20Controller],
    }).compile();

    controller = module.get<Erc20Controller>(Erc20Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
