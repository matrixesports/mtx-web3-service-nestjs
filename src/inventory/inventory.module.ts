import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { BattlePassModule } from 'src/battle-pass/battle-pass.module';

@Module({
  providers: [InventoryService, InventoryResolver],
  imports: [BattlePassModule],
})
export class InventoryModule {}
