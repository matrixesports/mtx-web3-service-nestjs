import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battle-pass/battle-pass.module';
import { LootboxResolver } from './lootbox.resolver';

@Module({
  providers: [LootboxResolver],
  imports: [BattlePassModule],
})
export class LootboxModule {}
