import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { GetBattlePassUserInfoChildDto } from '../dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePassUser')
export class UserResolver {
  constructor(private chainService: ChainService) {}

  @ResolveField()
  async xp(@Parent() parent: GetBattlePassUserInfoChildDto) {
    let userInfo = await parent.contract.userInfo(
      parent.userAddress,
      parent.seasonId,
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
      parent.seasonId,
    );

    let calls: ContractCall[] = [];
    let unclaimedFree = [];

    for (let x = 0; x <= userLevel; x++) {
      calls.push({
        reference: 'isRewardClaimed',
        address: parent.contract.address,
        abi: [parent.contract.interface.getFunction('isRewardClaimed')],
        method: 'isRewardClaimed',
        params: [parent.userAddress, parent.seasonId, x, false],
        value: 0,
      });
    }
    let results = await this.chainService.multicall(calls);
    for (let x = 0; x <= userLevel; x++) {
      if (!parseInt(results[x].returnData[1])) unclaimedFree.push(x);
    }
    return unclaimedFree;
  }

  @ResolveField()
  // only show if user is premium
  async premium(
    @Parent() parent: GetBattlePassUserInfoChildDto,
  ): Promise<GetBattlePassUserInfoChildDto> {
    let isPremium = await parent.contract.isUserPremium(
      parent.userAddress,
      parent.seasonId,
    );
    if (!isPremium) return null;
    return parent;
  }
}
