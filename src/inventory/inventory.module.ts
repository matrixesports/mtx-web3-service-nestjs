import { Module } from '@nestjs/common';
import { BattlepassModule } from 'src/battlepass/battlepass.module';
import { InventoryResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';

@Module({
  providers: [InventoryResolver, InventoryService],
  imports: [BattlepassModule],
})
export class InventoryModule {}
