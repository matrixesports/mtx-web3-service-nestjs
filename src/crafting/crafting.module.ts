import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { RecipeDB } from './crafting.entity';
import { CraftingResolver } from './crafting.resolver';
import { CraftingService } from './crafting.service';

@Module({
  providers: [CraftingService, CraftingResolver],
  imports: [BattlePassModule, TypeOrmModule.forFeature([RecipeDB])],
  controllers: [],
  exports: [CraftingService],
})
export class CraftingModule {}
