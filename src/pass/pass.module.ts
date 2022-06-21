import { Module } from '@nestjs/common';
import { PassService } from './pass.service';
import { PassResolver } from './pass.resolver';
import { StateModule } from './state/state.module';
import { UserModule } from './user/user.module';
import { PremUserModule } from './prem-user/prem-user.module';

@Module({
  providers: [PassService, PassResolver],
  imports: [StateModule, UserModule, PremUserModule],
})
export class PassModule {}
