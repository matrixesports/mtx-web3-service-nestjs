import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Recipe } from './recipe.entity';
import { RecipeService } from './recipe.service';

// only show active recipes
@Resolver('Recipe')
export class RecipeResolver {
  constructor(private recipeService: RecipeService) {}

  @Query()
  getRecipe(@Args() args) {
    const recipe = new Recipe();
    recipe.created_at = args.creatorId;
    recipe.recipe_id = args.recipeId;
    return this.recipeService.getRecipe(recipe);
  }

  @ResolveField()
  inputIngredients(@Parent() parent) {
    return 'x';
  }

  @ResolveField()
  outputIngredients(@Parent() parent) {
    return 'xx';
  }
}
