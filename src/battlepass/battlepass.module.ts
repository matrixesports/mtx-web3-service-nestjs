import { Module } from '@nestjs/common';
import { BattlepassResolver } from './battlepass.resolver';
import { LevelinfoModule } from './levelinfo/levelinfo.module';

@Module({
  providers: [BattlepassResolver],
  imports: [LevelinfoModule],
})
export class BattlepassModule {}
