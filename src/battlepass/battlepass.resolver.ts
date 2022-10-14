import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { BattlePass } from 'abi/typechain';
import { ChainService } from 'src/chain/chain.service';
import { RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { BattlePassService } from './battlepass.service';
import {
  GetBattlePassChildDto,
  GetBattlePassUserInfoChildDto,
} from './battlepass.dto';
import { Warn } from 'src/common/error.interceptor';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
    private metadataService: MetadataService,
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
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const missingFields = await this.battlePassService.checkRequiredFields(
      creatorId,
      userAddress,
      level,
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
    const abi = bp.interface.getFunction('claimReward');
    const fee = await this.chainService.getMaticFeeData();
    await this.chainService.metatx(
      abi,
      [seasonId, level, premium],
      userAddress,
      bp.address,
      fee,
    );
    const rewardGiven = await bp.seasonInfo(seasonId, level);
    let id: number;
    let qty: number;
    if (premium) {
      id = rewardGiven.premiumRewardId.toNumber();
      qty = rewardGiven.premiumRewardQty.toNumber();
    } else {
      id = rewardGiven.freeRewardId.toNumber();
      qty = rewardGiven.freeRewardQty.toNumber();
    }
    const metadata = await this.metadataService.getMetadata(creatorId, id);
    if (metadata.reward_type === RewardType.REDEEMABLE && autoRedeem) {
      await this.battlePassService.redeemItemHelper(
        id,
        userAddress,
        creatorId,
        bp.address,
        metadata,
      );
      const fee = await this.chainService.getMaticFeeData();
      await (await bp.burn(userAddress, id, 1, fee)).wait(1);
    } else if (metadata.reward_type === RewardType.LOOTBOX) {
      const abi = bp.interface.getFunction('openLootbox');
      const fee = await this.chainService.getMaticFeeData();
      fee['gasLimit'] = 1000000;
      const rc = await this.chainService.metatx(
        abi,
        [id],
        userAddress,
        bp.address,
        fee,
      );
      const logs = [];
      for (let i = 0; i < rc.logs.length; i++) {
        try {
          const log = rc.logs[i];
          logs.push(bp.interface.parseLog(log));
        } catch (e) {}
      }
      const log = logs.find((log: any) => log.name === 'LootboxOpened');
      const idxOpened = log.args.idxOpened.toNumber();
      const option = await contract.getLootboxOptionByIdx(id, idxOpened);
      const rewards = [];
      for (let y = 0; y < option[1].length; y++) {
        rewards.push(
          await this.battlePassService.createRewardObj(
            creatorId,
            option[1][y].toNumber(),
            option[2][y].toNumber(),
          ),
        );
      }
      return { success: true, reward: rewards };
    }
    const reward = await this.battlePassService.createRewardObj(
      creatorId,
      id,
      qty,
    );
    return { success: true, reward: [reward] };
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
    const metadata = await this.metadataService.getMetadata(creatorId, itemId);
    await this.battlePassService.mint(creatorId, userAddress, itemId, 1);
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
    return await this.battlePassService.getLevelInfo(parent);
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
