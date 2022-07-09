import { Module } from '@nestjs/common';
import { ContractModule } from 'src/contract/contract.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { LootboxResolver } from './lootbox.resolver';

@Module({
  providers: [LootboxResolver],
  imports: [ContractModule, MetadataModule],
})
export class LootboxModule {}
