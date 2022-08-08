import { Module } from '@nestjs/common';
import { BattlePassResolver } from './battle-pass.resolver';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battle-pass.entity';

@Module({
  providers: [BattlePassResolver, BattlePassService],
  imports: [TypeOrmModule.forFeature([BattlePassDB])],
  controllers: [BattlePassController],
})
export class BattlePassModule {}
