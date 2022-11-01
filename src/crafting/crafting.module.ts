import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from 'src/inventory/inventory.module';
import { RecipeDB } from './crafting.entity';
import { CraftingResolver } from './crafting.resolver';
import { CraftingService } from './crafting.service';

@Module({
  providers: [CraftingService, CraftingResolver],
  imports: [TypeOrmModule.forFeature([RecipeDB]), InventoryModule],
  controllers: [],
  exports: [CraftingService],
})
export class CraftingModule {}
