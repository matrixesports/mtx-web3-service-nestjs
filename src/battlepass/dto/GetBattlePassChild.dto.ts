import { BattlePass } from 'src/common/typechain';
import { BattlePass as BattlePassEntity } from '../battlepass.entity';

export class GetBattlePassChildDto {
  contract: BattlePass;
  seasonId: number;
  battlePassDB: BattlePassEntity;
  creatorId: number;
  maxLevel: number;
}
