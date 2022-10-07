import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { LeaderboardResolver, RankingResolver } from './leaderboard.resolver';
import { LeaderboardService } from './leaderboard.service';

@Module({
  providers: [LeaderboardService, LeaderboardResolver, RankingResolver],
  imports: [BattlePassModule],
  controllers: [],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
