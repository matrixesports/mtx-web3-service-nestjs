import { BattlePass } from 'abi/typechain';
import { BigNumber } from 'ethers';
import { BattlePassDB } from './battle-pass.entity';

export class GetBattlePassChildDto {
  contract: BattlePass;
  seasonId: BigNumber;
  battlePassDB: BattlePassDB;
  creatorId: number;
  maxLevel: BigNumber;
}

export class GetBattlePassUserInfoChildDto extends GetBattlePassChildDto {
  userAddress: string;
}

export class GiveXpDto {
  userAddress: string;
  creatorId: number;
  xp: number;
}

export class MintPremiumPassDto {
  userAddress: string;
  creatorId: number;
}
