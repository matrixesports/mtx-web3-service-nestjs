import { ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';

@Resolver('PremiumBattlePassUser')
export class PremiumResolver {
  @ResolveField()
  owned() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  unclaimedPremiumRewards() {
    return [];
  }
}
