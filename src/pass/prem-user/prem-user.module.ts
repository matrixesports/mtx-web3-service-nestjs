import { Module } from '@nestjs/common';
import { PremUserResolver } from './prem-user.resolver';

@Module({
  providers: [PremUserResolver],
})
export class PremUserModule {}
