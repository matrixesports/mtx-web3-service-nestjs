import { ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';

@Resolver('Reward')
export class RewardResolver {
  @ResolveField()
  id() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  qty() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  rewardType() {
    return {};
  }
  @ResolveField()
  metadata() {
    return {};
  }
}
