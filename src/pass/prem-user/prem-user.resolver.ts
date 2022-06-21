import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { PassReward } from 'src/graphql.schema';
import { GetPassUserInfoDto } from '../dto/GetPassUserInfo.dto';

@Resolver('PremiumUser')
export class PremUserResolver {
  constructor(private contractService: ContractService) {}
  @ResolveField()
  async owned(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    return await parent.contract.balanceOf(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetPassUserInfoDto,
  ): Promise<PassReward[]> {
    let rewards = [];
    let level = await parent.contract.level(
      parent.userAddress,
      parent.seasonId,
    );
    for (let x = 0; x <= level; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      let claimed = await parent.contract.isRewardClaimed(
        parent.userAddress,
        parent.seasonId,
        x,
        true,
      );
      if (
        claimed ||
        seasonInfo.premiumReward.token == ethers.constants.AddressZero
      )
        continue;
      let contractDB = await this.contractService.findByAddress(
        seasonInfo.premiumReward.token,
      );
      rewards.push({
        level: x,
        reward: {
          id: seasonInfo.premiumReward.id,
          qty: seasonInfo.premiumReward.qty,
          contractDB,
        },
      });
    }
    return rewards;
  }
}
