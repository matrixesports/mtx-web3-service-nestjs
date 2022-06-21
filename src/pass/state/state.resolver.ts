import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { PassReward } from 'src/graphql.schema';
import { GetPassDto } from '../dto/GetPass.dto';

@Resolver('PassState')
export class StateResolver {
  constructor(private contractService: ContractService) {}
  @ResolveField()
  async xp(@Parent() parent: GetPassDto): Promise<BigInt[]> {
    let xp = [];
    let maxLevel = await parent.contract.maxLevelInSeason(parent.seasonId);
    for (let x = 0; x <= maxLevel; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      xp.push(seasonInfo.xpToCompleteLevel);
    }
    return xp;
  }

  @ResolveField()
  async maxLevel(@Parent() parent: GetPassDto): Promise<BigInt> {
    return await parent.contract.maxLevelInSeason(parent.seasonId);
  }

  @ResolveField()
  async freeRewards(@Parent() parent: GetPassDto): Promise<PassReward[]> {
    let freeRewards = [];
    let maxLevel = await parent.contract.maxLevelInSeason(parent.seasonId);
    for (let x = 0; x <= maxLevel; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      if (seasonInfo.freeReward.token == ethers.constants.AddressZero) continue;
      let contractDB = await this.contractService.findByAddress(
        seasonInfo.freeReward.token,
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
    let premiumRewards = [];
    let maxLevel = await parent.contract.maxLevelInSeason(parent.seasonId);
    for (let x = 0; x <= maxLevel; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      if (seasonInfo.premiumReward.token == ethers.constants.AddressZero)
        continue;
      let contractDB = await this.contractService.findByAddress(
        seasonInfo.premiumReward.token,
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
