import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryDB, MetadataDB } from './inventory.entity';

@Module({
  providers: [InventoryService, InventoryResolver],
  imports: [TypeOrmModule.forFeature([InventoryDB, MetadataDB])],
  exports: [InventoryService],
})
export class InventoryModule {}
