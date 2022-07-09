import { Module } from '@nestjs/common';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';

@Module({
  providers: [BattlepassResolver],
  imports: [UserModule],
})
export class BattlepassModule {}
