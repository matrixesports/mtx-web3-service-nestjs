import { Test, TestingModule } from '@nestjs/testing';
import { RedeemableController } from './redeemable.controller';

describe('RedeemableController', () => {
  let controller: RedeemableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedeemableController],
    }).compile();

    controller = module.get<RedeemableController>(RedeemableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
