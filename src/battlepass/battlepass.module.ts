import { Module } from '@nestjs/common';
import { ContractModule } from 'src/contract/contract.module';
import { BattlepassResolver } from './battlepass.resolver';
import { LevelinfoModule } from './levelinfo/levelinfo.module';
import { UserModule } from './user/user.module';

@Module({
  providers: [BattlepassResolver],
  imports: [LevelinfoModule, UserModule, ContractModule],
})
export class BattlepassModule {}
