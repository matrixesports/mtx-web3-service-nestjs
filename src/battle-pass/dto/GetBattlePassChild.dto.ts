import { BattlePass } from 'abi/typechain';
import { BigNumber } from 'ethers';
import { BattlePassDB } from '../battle-pass.entity';

export class GetBattlePassChildDto {
  contract: BattlePass;
  seasonId: BigNumber;
  battlePassDB: BattlePassDB;
  creatorId: number;
  maxLevel: number;
}
