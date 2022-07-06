import { Injectable } from '@nestjs/common';
import { Contract } from 'ethers';
import { ContractService } from 'src/modules/contract/contract.service';
import { PassReward } from 'src/graphql.schema';
import { Contract as ContractDB } from 'src/modules/contract/entities/contract.entity';

@Injectable()
export class PassService {
  constructor(private contractService: ContractService) {}

  async getPassDB(creator_id: number): Promise<ContractDB> {
    const res = await this.contractService.find({
      creator_id: creator_id,
      ctr_type: 'Pass',
    });
    if (res.length == 0) {
      throw new Error(`Cannot get pass contract for creator: ${creator_id}`);
    }
    return res[0];
  }

  async getPassCtr(contractDB: ContractDB): Promise<Contract> {
    return this.contractService.create(contractDB);
  }
}
