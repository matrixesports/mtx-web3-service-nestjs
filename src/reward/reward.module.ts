import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { LeaderboardModule } from 'src/leaderboard/leaderboard.module';
import { LootboxResolver, LootdropResolver } from './reward.resolver';
import { RewardService } from './reward.service';

@Module({
  providers: [LootboxResolver, LootdropResolver, RewardService],
  imports: [BattlePassModule, LeaderboardModule, InventoryModule],
  exports: [RewardService],
})
export class RewardModule {}
