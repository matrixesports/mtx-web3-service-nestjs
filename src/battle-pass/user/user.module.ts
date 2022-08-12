import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { PremiumModule } from './premium/premium.module';

@Module({
  providers: [UserResolver],
  imports: [PremiumModule],
})
export class UserModule {}
