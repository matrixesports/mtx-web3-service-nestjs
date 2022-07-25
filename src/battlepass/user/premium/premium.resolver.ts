import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractCall, Multicall } from 'pilum';
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
    const multicall = new Multicall({ provider: parent.contract.provider });
    const { chainId } = await parent.contract.provider.getNetwork();
    let calls: ContractCall[] = [];

    for (let x = 0; x <= userLevel; x++) {
      calls.push({
        reference: 'isRewardClaimed',
        address: parent.contract.address,
        abi: [parent.contract.interface.getFunction('isRewardClaimed')],
        method: 'isRewardClaimed',
        params: [parent.userAddress, parent.seasonId, x, true],
        value: 0,
      });
    }
    let { results } = await multicall.call(calls, { network: chainId });

    for (let x = 0; x <= userLevel; x++) {
      if (!parseInt(results[x].returnData[1])) unclaimedPrem.push(x);
    }
    return unclaimedPrem;
  }
}
