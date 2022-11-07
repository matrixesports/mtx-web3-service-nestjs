import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ChainService } from 'src/chain/chain.service';
import { ClaimRewardResponse, MutationResponse, Reward, RewardType } from 'src/graphql.schema';
import { BattlePassService } from './battlepass.service';
import {
  GetBattlePassChildDto,
  GetBattlePassUserInfoChildDto,
  GetRankingDto,
} from './battlepass.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { MetadataDB } from 'src/inventory/inventory.entity';
import { ContractCall } from 'pilum';
import { MicroserviceService } from 'src/microservice/microservice.service';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
    private inventoryService: InventoryService,
    private microserviceService: MicroserviceService,
  ) {}

  /*
|========================| QUERY |========================|
*/

  @Query()
  async getBattlePass(@Args('creatorId') creatorId: number): Promise<GetBattlePassChildDto> {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = (await contract.seasonId()).toNumber();
    const maxLevel = (await contract.getMaxLevel(seasonId)).toNumber();
    const battlePassDB = await this.battlePassService.getBattlePass(creatorId);
    return {
      contract,
      seasonId,
      battlePassDB,
      creatorId,
      maxLevel,
    };
  }

  /*
|========================| MUTATION |========================|
*/

  /**
   * claim reward, if lootbox then open it, if redeemable item then redeem it
   * do not redeem items inside a lootbox
   * if autoRedeem == true then redeem item when u claim it
   * if level == 1 then check for required fields; assumes there will always be a reward at level 1
   * make sure u only give 1 lootbox, will not open all of them
   */
  @Mutation(() => ClaimRewardResponse)
  async claimReward(
    @Args('creatorId') creatorId: number,
    @Args('level') level: number,
    @Args('premium') premium: boolean,
    @Args('autoRedeem') autoRedeem: boolean,
    @Context() context,
  ): Promise<ClaimRewardResponse> {
    const userAddress: string = context.req.headers['user-address'];
    const battlePassDB = await this.battlePassService.getBattlePass(creatorId);
    const missingFields = await this.microserviceService.checkRequiredFields(
      userAddress,
      battlePassDB,
    );
    if (missingFields != null) {
      return {
        success: true,
        missingFields,
      };
    }
    let claimInfo: {
      bpAddress: string;
      reward: Reward[];
      metadata?: MetadataDB;
    };

    if (autoRedeem) {
      claimInfo = await this.battlePassService.claimRewardAtomic(
        creatorId,
        userAddress,
        level,
        premium,
      );
      if (claimInfo.metadata.rewardType === RewardType.REDEEMABLE)
        await this.microserviceService.sendRedeemAlert(
          claimInfo.metadata.id,
          userAddress,
          creatorId,
          claimInfo.bpAddress,
          claimInfo.metadata,
        );
    } else
      claimInfo = await this.battlePassService.claimReward(creatorId, userAddress, level, premium);
    return { success: true, reward: claimInfo.reward };
  }

  @Mutation(() => MutationResponse)
  async redeemReward(
    @Args('creatorId') creatorId: number,
    @Args('itemId') itemId: number,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    const bpAddress = await this.chainService.getBattlePassAddress(creatorId);
    const metadata = await this.inventoryService.getMetadata(creatorId, itemId);
    await this.battlePassService.burn(creatorId, userAddress, itemId, 1);
    await this.microserviceService.sendRedeemAlert(
      itemId,
      userAddress,
      creatorId,
      bpAddress,
      metadata,
    );
    return { success: true };
  }

  /*
|========================| FIELDS |========================|
*/

  @ResolveField()
  name(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.name;
  }

  @ResolveField()
  description(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.description;
  }

  @ResolveField()
  price(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.price;
  }

  @ResolveField()
  currency(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.currency;
  }

  @ResolveField()
  endDate(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.end_date;
  }

  @ResolveField()
  seasonId(@Parent() parent: GetBattlePassChildDto) {
    return parent.seasonId;
  }

  @ResolveField()
  async maxLevel(@Parent() parent: GetBattlePassChildDto) {
    return parent.maxLevel;
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetBattlePassChildDto,
    @Context() context,
  ): GetBattlePassUserInfoChildDto {
    const userAddress: string = context.req.headers['user-address'];
    return { ...parent, userAddress };
  }

  @ResolveField()
  async levelInfo(@Parent() parent: GetBattlePassChildDto) {
    return await this.battlePassService.getLevelInfo(
      parent.creatorId,
      parent.contract,
      parent.seasonId,
      parent.maxLevel,
    );
  }
}

@Resolver('BattlePassUser')
export class UserResolver {
  constructor(private battlePassService: BattlePassService) {}
  @ResolveField()
  async xp(@Parent() parent: GetBattlePassUserInfoChildDto) {
    const userInfo = await parent.contract.userInfo(parent.userAddress, parent.seasonId);
    return userInfo.xp.toNumber();
  }
  @ResolveField()
  async level(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return (await parent.contract.level(parent.userAddress, parent.seasonId)).toNumber();
  }

  @ResolveField()
  async unclaimedFreeRewards(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return await this.battlePassService.getUserRewards(parent, false);
  }

  @ResolveField()
  // only show if user is premium
  async premium(
    @Parent() parent: GetBattlePassUserInfoChildDto,
  ): Promise<GetBattlePassUserInfoChildDto> {
    const isPremium = await parent.contract.isUserPremium(parent.userAddress, parent.seasonId);
    if (!isPremium) return null;
    return parent;
  }
}

@Resolver('PremiumBattlePassUser')
export class PremiumUserResolver {
  constructor(private battlePassService: BattlePassService) {}

  @ResolveField()
  async owned(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return (await parent.contract.balanceOf(parent.userAddress, parent.seasonId)).toNumber();
  }

  @ResolveField()
  async unclaimedPremiumRewards(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return await this.battlePassService.getUserRewards(parent, true);
  }
}

@Resolver('SeasonRanking')
export class SeasonRankingResolver {
  constructor(
    private battlePassService: BattlePassService,
    private microserviceService: MicroserviceService,
  ) {}

  @Query()
  async getSeasonXpRanking(
    @Args('creatorId') creatorId: number,
    @Args('seasonId') seasonId: number,
  ) {
    const followers = await this.microserviceService.getFollowers(creatorId);
    return await this.battlePassService.getSeasonRankings(creatorId, seasonId, followers);
  }

  @ResolveField()
  rank(@Parent() parent: GetRankingDto) {
    return this.battlePassService.getRank(parent);
  }

  @ResolveField()
  topPercent(@Parent() parent: GetRankingDto) {
    return this.battlePassService.getTopPercent(parent);
  }
}

@Resolver('ReputationRanking')
export class ReputationRankingResolver {
  constructor(
    private battlePassService: BattlePassService,
    private microserviceService: MicroserviceService,
  ) {}

  @Query()
  async getReputationRankings(@Args('creatorId') creatorId: number) {
    const followers = await this.microserviceService.getFollowers(creatorId);
    return await this.battlePassService.getReputationRankings(creatorId, followers);
  }

  @Query()
  async getReputationRanking(@Args('creatorId') creatorId: number, @Context() context) {
    const userAddress: string = context.req.headers['user-address'];
    const followers = await this.microserviceService.getFollowers(creatorId);
    return await this.battlePassService.getReputationRanking(creatorId, followers, userAddress);
  }

  @ResolveField()
  rank(@Parent() parent: GetRankingDto) {
    return this.battlePassService.getRank(parent);
  }

  @ResolveField()
  topPercent(@Parent() parent: GetRankingDto) {
    return this.battlePassService.getTopPercent(parent);
  }
}

@Resolver('AllSeasonRanking')
export class AllSeasonRankingResolver {
  constructor(private battlePassService: BattlePassService) {}

  @Query()
  async getAllXpRanking(@Args('creatorId') creatorId: number) {
    return await this.battlePassService.getAllSeasonInfo(creatorId);
  }

  @ResolveField()
  rank(@Parent() parent: GetRankingDto) {
    return this.battlePassService.getRank(parent);
  }

  @ResolveField()
  topPercent(@Parent() parent: GetRankingDto) {
    return this.battlePassService.getTopPercent(parent);
  }
}

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(private chainService: ChainService, private inventoryService: InventoryService) {}

  @Query()
  async getLootboxOptions(
    @Args('creatorId') creatorId: number,
    @Args('lootboxId') lootboxId: number,
  ) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const lengthOfOptions = await contract.getLootboxOptionsLength(lootboxId);
    const allOptions = [];
    const calls: ContractCall[] = [];

    for (let x = 0; x < lengthOfOptions.toNumber(); x++) {
      calls.push({
        reference: 'getLootboxOptionByIdx',
        address: contract.address,
        abi: [contract.interface.getFunction('getLootboxOptionByIdx')],
        method: 'getLootboxOptionByIdx',
        params: [lootboxId, x],
        value: 0,
      });
    }
    const results = await this.chainService.multicall(calls);
    for (let x = 0; x < lengthOfOptions.toNumber(); x++) {
      //for some reason it return an array lol
      //arrays have len 1. keep an eye out for this
      const option = contract.interface.decodeFunctionResult(
        'getLootboxOptionByIdx',
        results[x].returnData[1],
      );
      const rewardsInOption = [];
      for (let y = 0; y < option[0].ids.length; y++) {
        rewardsInOption.push(
          await this.inventoryService.createRewardObj(
            creatorId,
            option[0].ids[y].toNumber(),
            option[0].qtys[y].toNumber(),
          ),
        );
      }
      allOptions.push({
        reward: rewardsInOption,
        probability: option[0].rarityRange[1].toNumber() - option[0].rarityRange[0].toNumber(),
      });
    }
    return allOptions;
  }
}
