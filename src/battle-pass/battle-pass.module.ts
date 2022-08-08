import { Module } from '@nestjs/common';
import { BattlePassResolver } from './battle-pass.resolver';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';

@Module({
  providers: [BattlePassResolver, BattlePassService],
  controllers: [BattlePassController]
})
export class BattlePassModule {}
