import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/modules/contract/contract.service';
import { PassReward } from 'src/common/directives/web3.service.directive';
import { GetPassDto } from '../dto/GetPass.dto';

@Resolver('PassState')
export class StateResolver {
  constructor(private contractService: ContractService) {}
  @ResolveField()
  async xp(@Parent() parent: GetPassDto): Promise<bigint[]> {
    const xp = [];
    const maxLevel = await parent.contract.maxLevelInSeason(parent.seasonId);
    for (let x = 0; x <= maxLevel; x++) {
      const seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      xp.push(seasonInfo.xpToCompleteLevel);
    }
    return xp;
  }

  @ResolveField()
  async maxLevel(@Parent() parent: GetPassDto): Promise<bigint> {
    return await parent.contract.maxLevelInSeason(parent.seasonId);
  }

  @ResolveField()
  async freeRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
    const freeRewards = [];
    const maxLevel = await parent.contract.maxLevelInSeason(parent.seasonId);
    for (let x = 0; x <= maxLevel; x++) {
      const seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      if (seasonInfo.freeReward.token == ethers.constants.AddressZero) continue;
      const contractDB = await this.contractService.findByAddress(
        seasonInfo.freeReward.token
      );

      freeRewards.push({
        level: x,
        reward: {
          id: seasonInfo.freeReward.id,
          qty: seasonInfo.freeReward.qty,
          contractDB,
        },
      });
    }
    return freeRewards;
  }

  @ResolveField()
  async premiumRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
    const premiumRewards = [];
    const maxLevel = await parent.contract.maxLevelInSeason(parent.seasonId);
    for (let x = 0; x <= maxLevel; x++) {
      const seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      if (seasonInfo.premiumReward.token == ethers.constants.AddressZero)
        continue;
      const contractDB = await this.contractService.findByAddress(
        seasonInfo.premiumReward.token
      );
      premiumRewards.push({
        level: x,
        reward: {
          id: seasonInfo.premiumReward.id,
          qty: seasonInfo.premiumReward.qty,
          contractDB,
        },
      });
    }
    return premiumRewards;
  }
}
