import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { GetBattlePassUserInfoChildDto } from 'src/battlepass/dto/GetBattlePassUserInfoChild.dto';
import { ContractService } from 'src/contract/contract.service';

@Resolver('PremiumBattlePassUser')
export class PremiumResolver {
  constructor(private contractService: ContractService) {}

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
    let calls: ContractCall[] = [];

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
    let results = await this.contractService.multicall(
      calls,
      parent.contract.provider
    );
    for (let x = 0; x <= userLevel.toNumber(); x++) {
      if (!parseInt(results[x].returnData[1])) unclaimedPrem.push(x);
    }
    return unclaimedPrem;
  }
}
