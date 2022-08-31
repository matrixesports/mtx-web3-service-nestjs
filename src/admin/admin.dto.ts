export class GiveXpDto {
  userAddress: string;
  creatorId: number;
  xp: number;
}

export class MintTokenDto {
  userAddress: string;
  creatorId: number;
  amount: number;
}

export class NewLootboxDto {
  creatorId: number;
  lootboxInfo: any;
}

export class NewRecipeDto {
  creatorId: number;
  inputIngredients: any;
  outputIngredients: any;
}

export class NewSeasonDto {
  creatorId: number;
  levelDetails: any;
}
