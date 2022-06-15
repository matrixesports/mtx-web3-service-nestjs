import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { RecipeResolver } from './recipe.resolver';
import { Recipe } from './recipe.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe]), ContractModule],
  providers: [RecipeService, RecipeResolver],
  controllers: [RecipeController],
})
export class RecipeModule {}
