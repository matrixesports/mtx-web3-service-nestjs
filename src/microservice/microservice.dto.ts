import { ApiProperty } from '@nestjs/swagger';

export const LEVELUP_ALERT = 'levelup';
export const NEW_LOOTDROP_ALERT = 'new-lootdrop';
export const PREM_PASS_ALERT = 'premium-pass';
export const LEADERBOARD_ALERT = 'leaderboard';
export const NEW_SEASON_ALERT = 'new-season';
export const CLAIM_LOOTDROP_ALERT = 'claim-lootdrop';

export class LevelUpAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  oldlvl: number;
  @ApiProperty({ type: Number })
  newlvl: number;
}

export class ClaimLootdropAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
}

export class LeaderboardAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  oldXpRank: number;
  @ApiProperty({ type: Number })
  newXpRank: number;
  @ApiProperty({ type: Number })
  oldRepRank: number;
  @ApiProperty({ type: Number })
  newRepRank: number;
  @ApiProperty({ type: String, required: false })
  pfp?: string;
  @ApiProperty({ type: String, required: false })
  name?: string;
}

export class PremPassAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  seasonId: number;
  @ApiProperty({
    type: Number,
    description: 'Number of consecutive premium passes',
  })
  streaks: number;
}

export class SeasonAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: Number })
  seasonId: number;
  @ApiProperty({ type: Number })
  price: string;
  @ApiProperty({ type: String })
  currency: string;
  @ApiProperty({ type: String, description: 'Name of the BattlePass' })
  name: string;
  @ApiProperty({ type: String, description: 'Description of the BattlePass' })
  description: string;
  @ApiProperty({ type: String, description: 'End date of the BattlePass' })
  end: string;
}

export class ShortUrl {
  shortUrl: string;
}

export class TicketRedeemBody {
  name: string;
  description: string;
  image: string;
  creatorId: number;
  itemId: number;
  userAddress: string;
  itemAddress: string;
}

export class TwitchRedeemBody {
  name: string;
  description: string;
  image: string;
  creatorId: number;
  itemId: number;
  userAddress: string;
  itemAddress: string;
}

export class RequiredFieldsBody {
  userAddress: string;
  required_user_social_options: string[];
  required_user_payment_options: string[];
}

export class RequiredFieldsResponse {
  missing_user_social_options: string[];
  missing_user_payment_options: string[];
}

export class Follower {
  id: string;
  pfp?: string;
  name?: string;
  userAddress: string;
}
