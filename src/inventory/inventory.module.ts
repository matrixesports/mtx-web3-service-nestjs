import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { BattlePassModule } from 'src/battle-pass/battle-pass.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryDB } from './inventory.entity';

@Module({
  providers: [InventoryService, InventoryResolver],
  imports: [BattlePassModule, TypeOrmModule.forFeature([InventoryDB])],
  exports: [InventoryService],
})
export class InventoryModule {}
