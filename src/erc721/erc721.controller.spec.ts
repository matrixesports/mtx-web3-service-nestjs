import { Test, TestingModule } from '@nestjs/testing';
import { Erc721Controller } from './erc721.controller';

describe('Erc721Controller', () => {
  let controller: Erc721Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Erc721Controller],
    }).compile();

    controller = module.get<Erc721Controller>(Erc721Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
