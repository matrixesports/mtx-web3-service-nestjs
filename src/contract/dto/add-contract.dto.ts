import { CtrType } from '../contract.entity';

export class AddContractDto {
  address: string;
  creator_id: number;
  ctr_type: CtrType;
  name: string;
  network: string;
}
