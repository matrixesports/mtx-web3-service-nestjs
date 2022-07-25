import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ContractService } from 'src/contract/contract.service';
import { RewardType } from 'src/graphql.schema';
import { rewardTypeArray } from 'src/types/rewardTypeArray';
import { BattlePassService } from './battlepass.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlePassService
  ) {}

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
    return await parent.contract.getMaxLevel(parent.seasonId);
  }

  @ResolveField()
  async levelInfo(@Parent() parent: GetBattlePassChildDto) {
    let maxLevel = await parent.contract.getMaxLevel(parent.seasonId);
    let levelInfo = [];
    for (let x = 0; x <= maxLevel; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      let freeReward = await this.battlePassService.getRewardForLevel(
        parent.contract,
        seasonInfo.freeRewardId,
        seasonInfo.freeRewardQty,
        parent.creatorId
      );
      let premiumReward = await this.battlePassService.getRewardForLevel(
        parent.contract,
        seasonInfo.premiumRewardId,
        seasonInfo.premiumRewardQty,
        parent.creatorId
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
  async getBattlePass(
    @Args('creatorId') creatorId: number
  ): Promise<GetBattlePassChildDto> {
    try {
      //seasonid,
      //max level,
      let contract = await this.battlePassService.getPassContract(creatorId);
      let seasonId = await contract.seasonId();
      let battlePassDB = await this.battlePassService.getBattlePassMetadata(
        contract.address
      );
      return { contract, seasonId, battlePassDB, creatorId };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  @Mutation()
  /**
   * claim reward, if lootbox then open it, if redeemable item then redeem it
   * do not redeem items inside a lootbox
   * if autoRedeem == true then redeem item when u claim it
   * if level == 1 then check for required fields; assumes there will always be a reward at level 1
   * make sure u only give 1 lootbox, will not open all of them
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
      if (level == 1) {
        let missingFields = await this.battlePassService.checkRequiredFields(
          userAddress,
          contract.address
        );
        if (missingFields != undefined) {
          if (
            missingFields.missing_user_payment_options.length != 0 ||
            missingFields.missing_user_social_options.length != 0
          ) {
            return {
              success: true,
              missingFields: {
                payment: missingFields.missing_user_payment_options,
                social: missingFields.missing_user_social_options,
              },
            };
          }
        }
      }

      let fee = await this.contractService.getMaticFeeData();
      let tx = await contract.claimReward(
        seasonId,
        userAddress,
        level,
        premium,
        fee
      );
      let provider = this.contractService.getProvider('matic');
      await provider.waitForTransaction(tx.hash, 1);

      let rewardGiven = await contract.seasonInfo(seasonId, level);
      let id;
      let qty;
      if (premium) {
        id = rewardGiven.premiumRewardId;
        qty = rewardGiven.premiumRewardQty;
      } else {
        id = rewardGiven.freeRewardId;
        qty = rewardGiven.freeRewardQty;
      }
      let rewardType;
      rewardType = await contract.checkType(id);
      if (rewardTypeArray[rewardType] === RewardType.REDEEMABLE) {
        if (autoRedeem) {
          await this.battlePassService.redeemItemHelper(
            contract,
            id.toNumber(),
            userAddress,
            creatorId,
            contract.address
          );
        }
      } else if (rewardTypeArray[rewardType] === RewardType.LOOTBOX) {
        //special case, u want to show all rewards rewarded in a lootbox
        let tx = await contract.openLootbox(id, userAddress, fee);
        let rc = await tx.wait();
        let event = rc.events?.find(event => event.event === 'LootboxOpened');
        const [lootboxId, idxOpened, user] = event.args;
        let option = await contract.getLootboxOptionByIdx(lootboxId, idxOpened);
        let rewards = [];
        for (let y = 0; y < option[1].length; y++) {
          console.log(y);
          rewards.push(
            await this.battlePassService.getRewardForLevel(
              contract,
              option[1][y],
              option[2][y],
              creatorId
            )
          );
        }
        return { success: true, reward: rewards };
      }
      let reward = await this.battlePassService.getRewardForLevel(
        contract,
        id,
        qty,
        creatorId
      );
      return { success: true, reward: [reward] };
    } catch (e) {
      console.log(e);
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
