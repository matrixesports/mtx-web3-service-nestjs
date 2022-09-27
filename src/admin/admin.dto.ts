import { Requirements } from 'src/graphql.schema';
import { GetLootdropDto } from 'src/reward/reward.dto';

export class GiveXpDto {
  userAddress: string;
  creatorId: number;
  xp: number;
}

export class MintTokenDto {
  userAddress: string;
  creatorId: number;
  amount: number;
  id: number;
}

export class MintReputationDto {
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

export class NewLootdropDto implements GetLootdropDto {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
}
