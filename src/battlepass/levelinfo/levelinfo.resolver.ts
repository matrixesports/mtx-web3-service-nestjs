import { ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';

@Resolver('LevelInfo')
export class LevelinfoResolver {
  @ResolveField()
  level() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  xpToCompleteLevel() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  freeReward() {
    return {};
  }
  @ResolveField()
  premiumReward() {
    return {};
  }
}
