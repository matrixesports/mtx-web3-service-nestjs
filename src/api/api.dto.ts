import { ApiProperty } from '@nestjs/swagger';
import { LootdropType, Requirements } from 'src/graphql.schema';
import { LootdropBase } from 'src/reward/reward.dto';

abstract class MintToken {
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  creatorId: number;
}

abstract class IBattlePass {
  @ApiProperty({ type: Number })
  creatorId: number;
}

export class MintXpDto implements MintToken {
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: Number })
  amount: number;
}

export class MintTokenDto implements MintToken {
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: Number })
  amount: number;
  @ApiProperty({ type: Number })
  id: number;
}

export const REPUTATION_TOKEN_ID = 1000;
export class MintRepDto implements MintToken {
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: Number })
  amount: number;
}

export class MintPremPassDto implements MintToken {
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  creatorId: number;
}

export class CreateLootboxDto implements IBattlePass {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty()
  lootboxInfo: any;
}

export class CreateRecipeDto implements IBattlePass {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty()
  inputIngredients: any;
  @ApiProperty()
  outputIngredients: any;
}

export class CreateSeasonDto implements IBattlePass {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty()
  levelDetails: any;
}

export class CreateLootdropDto implements LootdropBase, IBattlePass {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ enum: LootdropType })
  lootdropType: LootdropType;
  @ApiProperty({ type: Number })
  rewardId: number;
  @ApiProperty({ enum: Requirements })
  requirements: Requirements;
  @ApiProperty({ type: Number })
  threshold: number;
  @ApiProperty({ type: String })
  start: string;
  @ApiProperty({ type: String })
  end: string;
  @ApiProperty({ type: Number })
  qty: number;
  @ApiProperty({ type: Boolean })
  active: boolean;
}
