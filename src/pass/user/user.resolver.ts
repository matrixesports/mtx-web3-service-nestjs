import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { PassReward } from 'src/graphql.schema';
import { GetPassUserInfoDto } from '../dto/GetPassUserInfo.dto';
import { PassService } from '../pass.service';

@Resolver('PassUser')
export class UserResolver {
  constructor(private contractService: ContractService) {}

  @ResolveField()
  async xp(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    let userInfo = await parent.contract.userInfo(
      parent.userAddress,
      parent.seasonId,
    );

    return userInfo.xp;
  }

  @ResolveField()
  async level(@Parent() parent: GetPassUserInfoDto): Promise<BigInt> {
    return await parent.contract.level(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedFreeRewards(
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
        false,
      );
      if (
        claimed ||
        seasonInfo.freeReward.token == ethers.constants.AddressZero
      )
        continue;
      let contractDB = await this.contractService.findByAddress(
        seasonInfo.freeReward.token,
      );
      rewards.push({
        level: x,
        reward: {
          id: seasonInfo.freeReward.id,
          qty: seasonInfo.freeReward.qty,
          contractDB,
        },
      });
    }
    return rewards;
  }

  @ResolveField()
  async premium(
    @Parent() parent: GetPassUserInfoDto,
  ): Promise<GetPassUserInfoDto> {
    if (
      await parent.contract.isUserPremium(parent.userAddress, parent.seasonId)
    ) {
      return parent;
    } else {
      return null;
    }
  }
}
