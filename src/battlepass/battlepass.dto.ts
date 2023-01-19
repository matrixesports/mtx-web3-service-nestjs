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

export class GetRankingDto {
  userAddress: string;
  id: string;
  pfp: string;
  name: string;
  total: number;
  others: { total: number; userAddress: string }[];
}

export type Ranking = {
  userAddress: string;
  total: number;
};

export const MINECRAFT_TOKENS = ['minecraft', 'cubits', 'cubit', 'levels', 'level', 'manacube'];
