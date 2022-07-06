import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/modules/contract/contract.service';
import { PassReward } from 'src/common/directives/web3.service.directive';
import { GetPassUserInfoDto } from '../dto/GetPassUserInfo.dto';

@Resolver('PremiumUser')
export class PremUserResolver {
  constructor(private contractService: ContractService) {}
  @ResolveField()
  async owned(@Parent() parent: GetPassUserInfoDto): Promise<bigint> {
    return await parent.contract.balanceOf(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetPassUserInfoDto
  ): Promise<PassReward[]> {
    const rewards = [];
    const level = await parent.contract.level(
      parent.userAddress,
      parent.seasonId
    );
    for (let x = 0; x <= level; x++) {
      const seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      const claimed = await parent.contract.isRewardClaimed(
        parent.userAddress,
        parent.seasonId,
        x,
        true
      );
      if (
        claimed ||
        seasonInfo.premiumReward.token == ethers.constants.AddressZero
      )
        continue;
      const contractDB = await this.contractService.findByAddress(
        seasonInfo.premiumReward.token
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
