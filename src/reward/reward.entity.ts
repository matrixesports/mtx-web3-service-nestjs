import { Requirements, Reward } from 'src/graphql.schema';

export abstract class LootdropBase {
  creatorId: number;
  rewardId?: number;
  reward?: Reward;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty?: number;
}

export class LootdropRS implements LootdropBase {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
  url: string;
}

export class LootdropReward implements LootdropBase {
  creatorId: number;
  reward: Reward;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  url: string;
}
