import { ApiProperty } from '@nestjs/swagger';

export const LEVELUP_ALERT = 'levelup';
export const NEW_LOOTDROP_ALERT = 'new-lootdrop';
export const MINT_PREMIUM_PASS = 'mint-prem-pass';
export const LEADERBOARD_TOP3_ALERT = 'leaderboard-top3';
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
