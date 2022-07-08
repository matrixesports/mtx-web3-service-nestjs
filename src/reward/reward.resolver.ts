import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { LevelInfo, Reward } from 'src/graphql.schema';

@Resolver('Reward')
export class RewardResolver {
  @ResolveField()
  metadata(@Parent() parent: Reward) {
    return {};
  }
}
