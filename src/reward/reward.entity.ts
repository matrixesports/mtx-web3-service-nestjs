import { Requirements, Reward } from 'src/graphql.schema';

export class LootdropRS {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
}

export class LootdropInfo {
  creatorId: number;
  reward: Reward;
  threshold: number;
  requirements: Requirements;
  start: Date;
  end: Date;
  url: string;
}
