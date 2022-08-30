import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battle-pass/battle-pass.module';
import { CraftingService } from 'src/crafting/crafting.service';
import { LeaderboardResolver } from './leaderboard.resolver';
import { LeaderboardService } from './leaderboard.service';

@Module({
  providers: [LeaderboardService, LeaderboardResolver],
  imports: [BattlePassModule],
  controllers: [],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
