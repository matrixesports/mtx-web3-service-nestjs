import { Module } from '@nestjs/common';
import { RecipeResolver } from './recipe.resolver';

@Module({
  providers: [RecipeResolver],
})
export class RecipeModule {}
