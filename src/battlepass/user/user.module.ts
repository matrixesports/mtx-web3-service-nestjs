import { Module } from '@nestjs/common';
import { PremiumModule } from './premium/premium.module';
import { UserResolver } from './user.resolver';

@Module({
  providers: [UserResolver],
  imports: [PremiumModule],
})
export class UserModule {}
