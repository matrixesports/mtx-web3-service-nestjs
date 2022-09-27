import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { LootboxResolver, LootdropResolver } from './reward.resolver';

@Module({
  providers: [LootboxResolver, LootdropResolver],
  imports: [BattlePassModule],
})
export class RewardModule {}
