import { ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';

@Resolver('BattlePassUser')
export class UserResolver {
  @ResolveField()
  xp() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  level() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  unclaimedFreeRewards() {
    return [];
  }
  @ResolveField()
  premium() {
    return {};
  }
}
