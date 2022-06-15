import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { RecipeService } from './recipe.service';

// only show active recipes
@Resolver('Recipe')
export class RecipeResolver {
  constructor(private recipeService: RecipeService) {}

  @Query()
  async getRecipe(@Args() args) {
    return {
      contract: await this.recipeService.getRecipeContract(args.creatorId),
      recipeId: args.recipeId,
    };
  }

  @ResolveField()
  async inputIngredients(@Parent() parent) {
    console.log(parent);
    return 'x';
  }

  @ResolveField()
  async outputIngredients(@Parent() parent) {
    return 'xx';
  }
}
