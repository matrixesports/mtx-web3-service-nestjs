import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';

@Resolver('BattlePass')
export class BattlepassResolver {
  @ResolveField()
  name() {
    return 'a';
  }
  @ResolveField()
  description() {
    return 'a';
  }
  @ResolveField()
  price() {
    return 'a';
  }
  @ResolveField()
  currency() {
    return 'a';
  }
  @ResolveField()
  endDate() {
    return new Date();
  }
  @ResolveField()
  seasonId() {
    return ethers.BigNumber.from(1);
  }
  @ResolveField()
  levelInfo() {
    return [];
  }
  @Query()
  getBattlePass(@Args('creatorId') creatorId: number) {
    return {};
  }
}
