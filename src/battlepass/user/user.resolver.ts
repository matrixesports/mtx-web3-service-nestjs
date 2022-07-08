import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { GetBattlePassUserInfoChildDto } from '../dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePassUser')
export class UserResolver {
  @ResolveField()
  async xp(@Parent() parent: GetBattlePassUserInfoChildDto) {
    let userInfo = await parent.contract.userInfo(
      parent.userAddress,
      parent.seasonId
    );
    return userInfo.xp;
  }

  @ResolveField()
  async level(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return await parent.contract.level(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedFreeRewards(@Parent() parent: GetBattlePassUserInfoChildDto) {
    let userLevel = await parent.contract.level(
      parent.userAddress,
      parent.seasonId
    );
    let unclaimedFree = [];
    for (let x = 0; x <= userLevel; x++) {
      let isClaimed = await parent.contract.isRewardClaimed(
        parent.userAddress,
        parent.seasonId,
        x,
        false
      );
      if (!isClaimed) unclaimedFree.push(x);
    }
    return unclaimedFree;
  }
  @ResolveField()
  // only show if user is premium
  async premium(
    @Parent() parent: GetBattlePassUserInfoChildDto
  ): Promise<GetBattlePassUserInfoChildDto> {
    let isPremium = await parent.contract.isUserPremium(
      parent.userAddress,
      parent.seasonId
    );
    if (!isPremium) return null;
    return parent;
  }
}
