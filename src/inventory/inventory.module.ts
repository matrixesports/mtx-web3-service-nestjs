import { Module } from '@nestjs/common';
import { ContractModule } from 'src/contract/contract.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { InventoryResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';

@Module({
  providers: [InventoryResolver, InventoryService],
  imports: [ContractModule, MetadataModule],
})
export class InventoryModule {}
