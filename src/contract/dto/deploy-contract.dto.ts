import { CtrType } from '../contract.entity';

export class DeployContractDto {
  creator_id: number;
  ctr_type: CtrType;
  name: string;
  network: string;
  args?: Array<string | number>;
}
