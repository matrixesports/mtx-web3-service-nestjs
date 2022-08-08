import { BigNumber, Contract } from 'ethers';
import { BattlePassDB } from '../battle-pass.entity';

export class GetBattlePassChildDto {
  contract: Contract;
  seasonId: BigNumber;
  battlePassDB: BattlePassDB;
  creatorId: number;
  maxLevel: number;
}
