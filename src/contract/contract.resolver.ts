import { Args, Query, Resolver } from '@nestjs/graphql';
import { ContractService } from './contract.service';

@Resolver('ContractDB')
export class ContractResolver {
  constructor(private contractService: ContractService) {}

  @Query()
  async getContract(@Args() args) {
    let res = await this.contractService.find({ address: args.address });
    console.log(res);
    return res;
  }
}
