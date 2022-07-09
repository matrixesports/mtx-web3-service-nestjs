import { Module } from '@nestjs/common';
import { RedeemableResolver } from './redeemable.resolver';

@Module({
  providers: [RedeemableResolver],
  controllers: [],
})
export class RedeemableModule {}
