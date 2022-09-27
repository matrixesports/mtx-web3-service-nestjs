import { Requirements } from 'src/graphql.schema';

export class GetLootdropDto {
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
}
