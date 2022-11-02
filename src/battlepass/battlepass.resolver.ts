import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ChainService } from 'src/chain/chain.service';
import { Reward, RewardType } from 'src/graphql.schema';
import { BattlePassService } from './battlepass.service';
import {
  GetBattlePassChildDto,
  GetBattlePassUserInfoChildDto,
} from './battlepass.dto';
import { InventoryService } from 'src/inventory/inventory.service';
import { MetadataDB } from 'src/inventory/inventory.entity';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
    private inventoryService: InventoryService,
  ) {}

  /*
|========================| QUERY |========================|
*/

  @Query()
  async getBattlePass(
    @Args('creatorId') creatorId: number,
  ): Promise<GetBattlePassChildDto> {
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
  @Mutation()
  async claimReward(
    @Args('creatorId') creatorId: number,
    @Args('level') level: number,
    @Args('premium') premium: boolean,
    @Args('autoRedeem') autoRedeem: boolean,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];

    const missingFields = await this.battlePassService.checkRequiredFields(
      creatorId,
      userAddress,
    );
    if (missingFields != null) {
      return {
        success: true,
        missingFields: {
          payment: missingFields.missing_user_payment_options,
          social: missingFields.missing_user_social_options,
        },
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
        await this.battlePassService.redeemItemHelper(
          claimInfo.metadata.id,
          userAddress,
          creatorId,
          claimInfo.bpAddress,
          claimInfo.metadata,
        );
    } else
      claimInfo = await this.battlePassService.claimReward(
        creatorId,
        userAddress,
        level,
        premium,
      );
    for (let i = 0; i < claimInfo.reward.length; i++) {
      await this.inventoryService.increaseBalance(
        userAddress,
        creatorId,
        claimInfo.reward[i].id as number,
      );
    }
    return { success: true, reward: claimInfo.reward };
  }

  @Mutation()
  async redeemReward(
    @Args('creatorId') creatorId: number,
    @Args('itemId') itemId: number,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    const bpAddress = await this.battlePassService.getBattlePassAddress(
      creatorId,
    );
    const metadata = await this.inventoryService.getMetadata(creatorId, itemId);
    await this.battlePassService.burn(creatorId, userAddress, itemId, 1);
    await this.battlePassService.redeemItemHelper(
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
    const userInfo = await parent.contract.userInfo(
      parent.userAddress,
      parent.seasonId,
    );
    return userInfo.xp.toNumber();
  }
  @ResolveField()
  async level(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return (
      await parent.contract.level(parent.userAddress, parent.seasonId)
    ).toNumber();
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
    const isPremium = await parent.contract.isUserPremium(
      parent.userAddress,
      parent.seasonId,
    );
    if (!isPremium) return null;
    return parent;
  }
}

@Resolver('PremiumBattlePassUser')
export class PremiumUserResolver {
  constructor(private battlePassService: BattlePassService) {}

  @ResolveField()
  async owned(@Parent() parent: GetBattlePassUserInfoChildDto) {
    return (
      await parent.contract.balanceOf(parent.userAddress, parent.seasonId)
    ).toNumber();
  }

  @ResolveField()
  async unclaimedPremiumRewards(
    @Parent() parent: GetBattlePassUserInfoChildDto,
  ) {
    return await this.battlePassService.getUserRewards(parent, true);
  }
}
