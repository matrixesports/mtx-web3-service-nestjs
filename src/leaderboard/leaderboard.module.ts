import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import {
  AllSeasonRankingResolver,
  ReputationRankingResolver,
  SeasonRankingResolver,
} from './leaderboard.resolver';
import { LeaderboardService } from './leaderboard.service';

@Module({
  providers: [
    LeaderboardService,
    SeasonRankingResolver,
    AllSeasonRankingResolver,
    ReputationRankingResolver,
  ],
  imports: [BattlePassModule],
  controllers: [],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
