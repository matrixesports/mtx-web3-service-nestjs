import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { GetBattlePassUserInfoChildDto } from './battle-pass.dto';
import { ChainService } from 'src/chain/chain.service';

@Resolver('PremiumBattlePassUser')
export class PremiumUserResolver {
  constructor(private chainService: ChainService) {}

  @ResolveField()
  async owned(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return await parent.contract.balanceOf(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetBattlePassUserInfoChildDto,
  ) {
    const userLevel = await parent.contract.level(
      parent.userAddress,
      parent.seasonId,
    );
    const unclaimedPrem = [];
    const calls: ContractCall[] = [];

    for (let x = 0; x <= userLevel.toNumber(); x++) {
      calls.push({
        reference: 'isRewardClaimed',
        address: parent.contract.address,
        abi: [parent.contract.interface.getFunction('isRewardClaimed')],
        method: 'isRewardClaimed',
        params: [parent.userAddress, parent.seasonId, x, true],
        value: 0,
      });
    }
    const results = await this.chainService.multicall(calls);
    // returns true for empty rewards
    for (let x = 0; x <= userLevel.toNumber(); x++) {
      if (!parseInt(results[x].returnData[1])) unclaimedPrem.push(x);
    }
    return unclaimedPrem;
  }
}
