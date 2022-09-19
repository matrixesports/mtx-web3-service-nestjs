import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { LeaderboardResolver } from './leaderboard.resolver';
import { LeaderboardService } from './leaderboard.service';

@Module({
  providers: [LeaderboardService, LeaderboardResolver],
  imports: [BattlePassModule],
  controllers: [],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
