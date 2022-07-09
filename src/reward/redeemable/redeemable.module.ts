import { Module } from '@nestjs/common';
import { RedeemableResolver } from './redeemable.resolver';

@Module({
  providers: [RedeemableResolver]
})
export class RedeemableModule {}
