import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battle-pass/battle-pass.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { LootboxResolver } from './lootbox.resolver';

@Module({
  providers: [LootboxResolver],
  imports: [BattlePassModule, MetadataModule],
})
export class LootboxModule {}
