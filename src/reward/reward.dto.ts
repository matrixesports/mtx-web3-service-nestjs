import { ApiProperty } from '@nestjs/swagger';
import {
  Requirements,
  Reward as RewardGQL,
  RewardMetadata as RewardMetadataGQL,
  RewardType,
} from 'src/graphql.schema';

export class RewardMetadata implements RewardMetadataGQL {
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  description: string;
  @ApiProperty({ type: String })
  image: string;
}

export class Reward implements RewardGQL {
  @ApiProperty({ type: Number })
  id: number;
  @ApiProperty({ type: Number })
  qty: number;
  @ApiProperty({ type: RewardMetadata })
  metadata: RewardMetadata;
  @ApiProperty({ enum: RewardType })
  rewardType: RewardType;
  @ApiProperty({ type: Number })
  creatorId: number;
}

export abstract class LootdropBase {
  lootdropId?: string;
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
  lootdropId?: string;
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
  url: string;
}

export class NewLootdrops {
  [x: string]: LootdropRS;
}

export class LootdropReward implements LootdropBase {
  @ApiProperty({ type: String })
  lootdropId?: string;
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: Reward })
  reward: Reward;
  @ApiProperty({ enum: Requirements })
  requirements: Requirements;
  @ApiProperty({ type: Number })
  threshold: number;
  @ApiProperty({ type: String })
  start: string;
  @ApiProperty({ type: String })
  end: string;
  @ApiProperty({ type: String })
  url: string;
}

export class GetLootdropDto implements LootdropRS {
  lootdropId?: string;
  creatorId: number;
  rewardId: number;
  requirements: Requirements;
  threshold: number;
  start: string;
  end: string;
  qty: number;
  url: string;
}
