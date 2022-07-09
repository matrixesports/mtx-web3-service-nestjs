import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { LevelInfo, RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePass')
export class BattlepassResolver {
  rewardTypeArray: RewardType[];
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService
  ) {
    this.rewardTypeArray = Object.values(RewardType);
  }

  @ResolveField()
  name(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  description(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  price(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  currency(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  endDate(@Parent() parent: GetBattlePassChildDto) {
    return new Date();
  }

  @ResolveField()
  seasonId(@Parent() parent: GetBattlePassChildDto) {
    return parent.seasonId;
  }

  @ResolveField()
  async maxLevel(@Parent() parent: GetBattlePassChildDto) {
    return await parent.contract.getMaxLevel(parent.seasonId);
  }

  @ResolveField()
  /**
   * for a free reward or premium reward if reward id is invalid then return null for that reward
   * use an array here since contarct enum value returns a uint, so easier to reference by index
   */
  async levelInfo(@Parent() parent: GetBattlePassChildDto) {
    let maxLevel = await parent.contract.getMaxLevel(parent.seasonId);
    let levelInfo = [];
    for (let x = 0; x <= maxLevel; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      let freeReward;
      let premiumReward;
      try {
        let freeRewardType = await parent.contract.checkType(
          seasonInfo.freeRewardId
        );
        let rewardType = this.rewardTypeArray[freeRewardType];
        let uri = await parent.contract.uri(seasonInfo.freeRewardId);
        freeReward = {
          id: seasonInfo.freeRewardId,
          qty: seasonInfo.freeRewardQty,
          metadata: await this.metadataService.readFromIPFS(uri),
          rewardType,
        };
      } catch (e) {
        freeReward = null;
      }

      try {
        let premiumRewardType = await parent.contract.checkType(
          seasonInfo.premiumRewardId
        );
        let rewardType = this.rewardTypeArray[premiumRewardType];
        let uri = await parent.contract.uri(seasonInfo.premiumRewardId);
        premiumReward = {
          id: seasonInfo.premiumRewardId,
          qty: seasonInfo.premiumRewardQty,
          metadata: await this.metadataService.readFromIPFS(uri),
          rewardType,
        };
      } catch (e) {
        premiumReward = null;
      }

      levelInfo.push({
        level: x,
        xpToCompleteLevel: seasonInfo.xpToCompleteLevel,
        freeReward,
        premiumReward,
      });
    }
    return levelInfo;
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetBattlePassChildDto,
    @Context() context
  ): GetBattlePassUserInfoChildDto {
    let userAddress: string = context.req.headers['user-address'];
    if (userAddress == undefined || userAddress == null) return null;
    // check if the address is valid
    try {
      userAddress = ethers.utils.getIcapAddress(userAddress);
    } catch (e) {
      return null;
    }
    return { ...parent, userAddress };
  }

  @Query()
  /**
   * return null if cannot find pass contract for creator
   */
  async getBattlePass(
    @Args('creatorId') creatorId: number
  ): Promise<GetBattlePassChildDto> {
    let contractDBEntries = await this.contractService.findForCreator(
      creatorId,
      'BattlePass'
    );
    if (contractDBEntries.length == 0) return null;
    let contract = this.contractService.getProviderContract(
      contractDBEntries[0]
    );
    let seasonId = await contract.seasonId();
    return { contract, seasonId };
  }
}
