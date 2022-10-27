import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  providers: [InventoryService, InventoryResolver],
  imports: [BattlePassModule, MetadataModule],
})
export class InventoryModule {}
