import { Requirements } from 'src/graphql.schema';

export class LootdropRS {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
}
