import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PassReward } from 'src/graphql.schema';
import { GetPassUserInfoDto } from '../user/dto/get-pass-user-info.dto';

@Resolver('PremiumPassUser')
export class PremUserResolver {
  @ResolveField()
  async owned(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    return await parent.contract.balanceOf(
      parent.userAddress,
      parent.activePassId,
    );
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetPassUserInfoDto,
  ): Promise<PassReward[]> {
    let currentLevel = await parent.contract.level(
      parent.userAddress,
      parent.activePassId,
    );
    let unclaimedRewards = [];
    //current level of 3 means, u are eligible for rewards at level 3
    for (let x = 1; x <= currentLevel; x++) {
      let res = await parent.contract.getUserInfo(
        parent.userAddress,
        parent.activePassId,
        x,
        true,
      );
      // res is xp, prem, claimed
      if (res[2]) {
        //nothin;
      } else {
        let reward = await parent.contract.passInfo(parent.activePassId, x);
        let bundle = reward.premiumReward;
        if (
          bundle.erc20s.addresses.length == 0 &&
          bundle.erc721s.addresses.length == 0 &&
          bundle.erc1155s.addresses.length == 0
        ) {
          continue;
        }
        unclaimedRewards.push({
          level: x,
          bundle: bundle,
        });
      }
    }
    return unclaimedRewards;
  }
}
