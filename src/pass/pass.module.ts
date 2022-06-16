import { Module } from '@nestjs/common';
import { PassController } from './pass.controller';
import { PassService } from './pass.service';
import { PassResolver } from './pass.resolver';
import { PremUserModule } from './prem-user/prem-user.module';
import { StateModule } from './state/state.module';
import { RewardModule } from './reward/reward.module';
import { UserResolver } from './user/user.resolver';
import { UserModule } from './user/user.module';

@Module({
  controllers: [PassController],
  providers: [PassService, PassResolver, UserResolver],
  imports: [PremUserModule, StateModule, RewardModule, UserModule],
})
export class PassModule {}
