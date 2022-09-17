import { Recipe } from './crafting.entity';

export class GetRecipeDto {
  creatorId: number;
  recipeId: number;
  recipe: Recipe;
  active: boolean;
  owner?: {
    name: string;
    slug: string;
    pfp: string;
  };
}
