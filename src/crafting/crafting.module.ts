import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataModule } from 'src/metadata/metadata.module';
import { RecipeDB } from './crafting.entity';
import { CraftingResolver } from './crafting.resolver';
import { CraftingService } from './crafting.service';

@Module({
  providers: [CraftingService, CraftingResolver],
  imports: [MetadataModule, TypeOrmModule.forFeature([RecipeDB])],
  controllers: [],
  exports: [CraftingService],
})
export class CraftingModule {}
