import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { LeaderboardModule } from 'src/leaderboard/leaderboard.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { LootboxResolver, LootdropResolver } from './reward.resolver';
import { RewardService } from './reward.service';

@Module({
  providers: [LootboxResolver, LootdropResolver, RewardService],
  imports: [BattlePassModule, LeaderboardModule, MetadataModule],
})
export class RewardModule {}
