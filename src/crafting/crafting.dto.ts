import { Result } from 'ethers/lib/utils';

export class GetRecipeDto {
  creatorId: number;
  recipeId: number;
  inputIngredients?: Result;
  outputIngredients?: Result;
}
