import { Contract } from 'ethers';
import { BattlePass } from '../battlepass.entity';

export class GetBattlePassChildDto {
  contract: Contract;
  seasonId: number;
  battlePassDB: BattlePass;
  creatorId: number;
}
