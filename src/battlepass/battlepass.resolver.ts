import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { RewardType } from 'src/graphql.schema';
import { rewardTypeArray } from 'src/types/rewardTypeArray';
import { Repository } from 'typeorm';
import { BattlePass as BattlePassDB } from './battlepass.entity';
import { BattlepassService } from './battlepass.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePass')
export class BattlepassResolver {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlepassService,
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>
  ) {}

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
      let freeReward = await this.battlePassService.getRewardForLevel(
        parent.contract,
        seasonInfo.freeRewardId,
        seasonInfo.freeRewardQty
      );
      let premiumReward = await this.battlePassService.getRewardForLevel(
        parent.contract,
        seasonInfo.premiumRewardId,
        seasonInfo.premiumRewardQty
      );
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
    return { ...parent, userAddress };
  }

  @Query()
  /**
   * return null if cannot find pass contract for creator
   */
  async getBattlePass(
    @Args('creatorId') creatorId: number
  ): Promise<GetBattlePassChildDto> {
    try {
      let contract = await this.battlePassService.getPassContract(creatorId);
      let seasonId = await contract.seasonId();
      return { contract, seasonId };
    } catch (e) {
      return null;
    }
  }

  @Mutation()
  /**
   * claim reward, if lootbox then open it, if redeemable item then redeem it
   * do not redeem items inside a lootbox
   * should we open the lootbox?
   */
  async claimReward(
    @Args('creatorId') creatorId: number,
    @Args('level') level: number,
    @Args('premium') premium: boolean,
    @Args('autoRedeem') autoRedeem: boolean,
    @Context() context
  ) {
    try {
      let userAddress: string = context.req.headers['user-address'];
      let contract = await this.battlePassService.getPassContract(
        creatorId,
        true
      );
      let seasonId = await contract.seasonId();
      let fee = await this.contractService.getMaticFeeData();
      await contract.claimReward(seasonId, userAddress, level, premium, fee);

      let rewardGiven = await contract.seasonInfo(seasonId, level);
      let id;
      if (premium) {
        id = rewardGiven.premiumRewardId;
      } else {
        id = rewardGiven.freeRewardId;
      }
      let rewardType;
      rewardType = await contract.checkType(id);

      if (rewardTypeArray[rewardType] == RewardType.REDEEMABLE) {
        if (!autoRedeem) return { success: true };
        await this.battlePassService.redeemItemHelper(
          contract,
          id.toNumber(),
          userAddress,
          creatorId,
          contract.address
        );
      } else if (rewardTypeArray[rewardType] == RewardType.LOOTBOX) {
        fee = await this.contractService.getMaticFeeData();
        await contract.openLootbox(id, userAddress, fee);
      }
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Mutation()
  async redeemReward(
    @Args('creatorId') creatorId: number,
    @Args('itemId') itemId: number,
    @Context() context
  ) {
    try {
      let userAddress: string = context.req.headers['user-address'];

      let contract = await this.battlePassService.getPassContract(
        creatorId,
        true
      );
      await this.battlePassService.redeemItemHelper(
        contract,
        itemId,
        userAddress,
        creatorId,
        contract.address
      );
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
