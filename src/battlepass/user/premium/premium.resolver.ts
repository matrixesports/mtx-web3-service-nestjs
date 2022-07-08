import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { GetBattlePassUserInfoChildDto } from 'src/battlepass/dto/GetBattlePassUserInfoChild.dto';

@Resolver('PremiumBattlePassUser')
export class PremiumResolver {
  @ResolveField()
  async owned(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return await parent.contract.balanceOf(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetBattlePassUserInfoChildDto
  ) {
    let userLevel = await parent.contract.level(
      parent.userAddress,
      parent.seasonId
    );
    let unclaimedPrem = [];
    for (let x = 0; x <= userLevel; x++) {
      let isClaimed = await parent.contract.isRewardClaimed(
        parent.userAddress,
        parent.seasonId,
        x,
        true
      );
      if (!isClaimed) unclaimedPrem.push(x);
    }
    return unclaimedPrem;
  }
}
