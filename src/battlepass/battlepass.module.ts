import { Module } from '@nestjs/common';
import { ContractModule } from 'src/contract/contract.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';

@Module({
  providers: [BattlepassResolver],
  imports: [UserModule, ContractModule, MetadataModule],
})
export class BattlepassModule {}
