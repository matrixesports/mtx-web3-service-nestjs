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
