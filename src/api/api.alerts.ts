import { ApiProperty } from '@nestjs/swagger';

export const LEVELUP_ALERT = 'levelup';
export const NEW_LOOTDROP_ALERT = 'new-lootdrop';
export const MINT_PREMIUM_PASS = 'mint-prem-pass';
export const LEADERBOARD_TOP3_ALERT = 'leaderboard-top3';
export const NEW_SEASON_ALERT = 'new-season';

export class LevelUpAlert {
  @ApiProperty({ type: Number })
  creatorId: number;
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  oldlvl: number;
  @ApiProperty({ type: Number })
  newlvl: number;
  @ApiProperty({ type: Number, description: 'Previous Season Xp Rank' })
  oldrank: number;
  @ApiProperty({ type: Number, description: 'New Season Xp Rank' })
  newrank: number;
}
