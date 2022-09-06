import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryDB } from './inventory.entity';
import { BattlePassDB } from 'src/battle-pass/battle-pass.entity';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  providers: [InventoryService, InventoryResolver],
  imports: [
    MetadataModule,
    TypeOrmModule.forFeature([BattlePassDB, InventoryDB]),
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
