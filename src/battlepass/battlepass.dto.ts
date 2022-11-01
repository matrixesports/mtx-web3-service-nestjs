import { ApiProperty } from '@nestjs/swagger';
import { BattlePass } from 'abi/typechain';
import { BattlePassDB } from './battlepass.entity';

export class GetBattlePassChildDto {
  contract: BattlePass;
  seasonId: number;
  battlePassDB: BattlePassDB;
  creatorId: number;
  maxLevel: number;
}

export class GetBattlePassUserInfoChildDto extends GetBattlePassChildDto {
  userAddress: string;
}

export class LevelUpAlert {
  @ApiProperty({ type: String })
  userAddress: string;
  @ApiProperty({ type: Number })
  newlvl: number;
}

/*
|========================| DEFINITIONS |========================|
*/

export interface TicketRedeemBody {
  name: string;
  description: string;
  image: string;
  creatorId: number;
  itemId: number;
  userAddress: string;
  itemAddress: string;
}

export interface TwitchRedeemBody {
  name: string;
  description: string;
  image: string;
  creatorId: number;
  itemId: number;
  userAddress: string;
  itemAddress: string;
}

export interface RequiredFieldsBody {
  userAddress: string;
  required_user_social_options: string[];
  required_user_payment_options: string[];
}

export interface RequiredFieldsResponse {
  missing_user_social_options: string[];
  missing_user_payment_options: string[];
}
