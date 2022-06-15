import { Test, TestingModule } from '@nestjs/testing';
import { LootboxController } from './lootbox.controller';

describe('LootboxController', () => {
  let controller: LootboxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LootboxController],
    }).compile();

    controller = module.get<LootboxController>(LootboxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
