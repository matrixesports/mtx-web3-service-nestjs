import { Requirements } from 'src/graphql.schema';
import { LootdropRS } from './reward.entity';

export class GetLootdropDto implements LootdropRS {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
  shortUrl: string;
}
