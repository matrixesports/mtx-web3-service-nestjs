import { Crafting } from 'src/common/typechain';

export class GetRecipeChildDto {
  contract: Crafting;
  recipeId: number;
  creatorId: number;
}
