import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { GetBattlePassUserInfoChildDto } from 'src/battle-pass/dto/GetBattlePassUserInfoChild.dto';
import { ChainService } from 'src/chain/chain.service';

@Resolver()
export class PremiumResolver {
  constructor(private chainService: ChainService) {}

  @ResolveField()
  async owned(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return await parent.contract.balanceOf(parent.userAddress, parent.seasonId);
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetBattlePassUserInfoChildDto,
  ) {
    let userLevel = await parent.contract.level(
      parent.userAddress,
      parent.seasonId,
    );
    let unclaimedPrem = [];
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
    let results = await this.chainService.multicall(calls);
    for (let x = 0; x <= userLevel; x++) {
      if (!parseInt(results[x].returnData[1])) unclaimedPrem.push(x);
    }
    return unclaimedPrem;
  }
}
