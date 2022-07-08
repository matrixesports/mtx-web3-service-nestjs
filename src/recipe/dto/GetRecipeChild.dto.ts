import { Contract } from 'ethers';

export class GetRecipeChildDto {
  contract: Contract;
  recipeId: number;
  creatorId: number;
}
