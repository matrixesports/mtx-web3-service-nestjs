import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battle-pass/battle-pass.module';
import { CraftingModule } from 'src/crafting/crafting.module';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  imports: [CraftingModule, BattlePassModule],
})
export class AdminModule {}
