import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { BattlePassModule } from 'src/battlepass/battlepass.module';

@Module({
  providers: [InventoryService, InventoryResolver],
  imports: [BattlePassModule],
})
export class InventoryModule {}
