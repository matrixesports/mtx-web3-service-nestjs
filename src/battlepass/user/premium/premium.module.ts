import { Module } from '@nestjs/common';
import { PremiumResolver } from './premium.resolver';

@Module({
  providers: [PremiumResolver]
})
export class PremiumModule {}
