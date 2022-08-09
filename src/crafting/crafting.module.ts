import { Module } from '@nestjs/common';
import { CraftingResolver } from './crafting.resolver';
import { CraftingService } from './crafting.service';

@Module({
  providers: [CraftingService, CraftingResolver],
  imports: [],
  controllers: [],
  exports: [CraftingService],
})
export class BattlePassModule {}
