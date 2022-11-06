import { ApiProperty } from '@nestjs/swagger';
import { Requirements } from 'src/graphql.schema';
import { LootdropReward, Reward } from 'src/reward/reward.dto';

export const LEVELUP_ALERT = 'levelup';
export const NEW_LOOTDROP_ALERT = 'new-lootdrop';
export const PREM_PASS_ALERT = 'premium-pass';
export const LEADERBOARD_ALERT = 'leaderboard';
export const NEW_SEASON_ALERT = 'new-season';
export const CLAIM_LOOTDROP_ALERT = 'claim-lootdrop';

abstract class BaseAlert {
  creatorId: number;
  userAddress: string;
  pfp: string;
  name: string;
}
export class LevelUpAlert implements BaseAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  oldlvl: number;
  @ApiProperty({ type: Number })
  newlvl: number;
  @ApiProperty({ type: String })
  pfp: string;
  @ApiProperty({ type: String })
  name: string;
}

export class ClaimLootdropAlert implements BaseAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: String })
  pfp: string;
  @ApiProperty({ type: String })
  name: string;
}

export class LeaderboardAlert implements BaseAlert {
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
  @ApiProperty({ type: String })
  pfp: string;
  @ApiProperty({ type: String })
  name: string;
}

export class PremPassAlert implements BaseAlert {
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
  @ApiProperty({ type: String })
  pfp: string;
  @ApiProperty({ type: String })
  name: string;
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

export class LootdropAlert implements LootdropReward {
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
  contactInfo?: string;
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

export class RequiredFields {
  userAddress: string;
  required_user_social_options: string[];
  required_user_payment_options: string[];
}

export class UserInfo {
  pfp: string;
  name: string;
}
export class Follower implements UserInfo {
  id: string;
  pfp: string;
  name: string;
  userAddress: string;
}
