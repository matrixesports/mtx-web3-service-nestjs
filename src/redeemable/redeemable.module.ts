import { Module } from '@nestjs/common';
import { RedeemableController } from './redeemable.controller';
import { RedeemableService } from './redeemable.service';
import { RedeemableResolver } from './redeemable.resolver';

@Module({
  controllers: [RedeemableController],
  providers: [RedeemableService, RedeemableResolver]
})
export class RedeemableModule {}
