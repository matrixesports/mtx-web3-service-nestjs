import { CreateLootdropDto } from 'src/api/api.dto';
import { Requirements } from 'src/graphql.schema';

export class LootdropRS implements CreateLootdropDto {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
  shortUrl: string;
}
