import { Module } from '@nestjs/common';
import { ContractModule } from 'src/contract/contract.module';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';

@Module({
  providers: [BattlepassResolver],
  imports: [UserModule, ContractModule],
})
export class BattlepassModule {}
