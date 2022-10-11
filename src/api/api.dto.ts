import { Requirements } from 'src/graphql.schema';
import { LootdropRS } from 'src/reward/reward.entity';

abstract class MintToken {
  userAddress: string;
  creatorId: number;
}

abstract class IBattlePass {
  creatorId: number;
}

export class MintXpDto implements MintToken {
  userAddress: string;
  creatorId: number;
  amount: number;
}

export class MintTokenDto implements MintToken {
  userAddress: string;
  creatorId: number;
  amount: number;
  id: number;
}

export const REPUTATION_TOKEN_ID = 1000;
export class MintRepDto implements MintToken {
  userAddress: string;
  creatorId: number;
  amount: number;
}

export class MintPremPassDto implements MintToken {
  userAddress: string;
  creatorId: number;
}

export class CreateLootboxDto implements IBattlePass {
  creatorId: number;
  lootboxInfo: any;
}

export class CreateRecipeDto implements IBattlePass {
  creatorId: number;
  inputIngredients: any;
  outputIngredients: any;
}

export class CreateSeasonDto implements IBattlePass {
  creatorId: number;
  levelDetails: any;
}

export class CreateLootdropDto implements LootdropRS, IBattlePass {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
}

export class ShortUrl {
  shortUrl: string;
}
