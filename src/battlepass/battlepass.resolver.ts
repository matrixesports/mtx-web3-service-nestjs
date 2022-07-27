import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { ContractService } from 'src/contract/contract.service';
import { RewardType } from 'src/graphql.schema';
import { BattlePassService } from './battlepass.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlePassService,
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
    return parent.maxLevel;
  }

  @ResolveField()
  async levelInfo(@Parent() parent: GetBattlePassChildDto) {
    let levelInfo = [];
    let calls: ContractCall[] = [];
    for (let x = 0; x <= parent.maxLevel; x++) {
      calls.push({
        reference: 'seasonInfo',
        address: parent.contract.address,
        abi: [parent.contract.interface.getFunction('seasonInfo')],
        method: 'seasonInfo',
        params: [parent.seasonId, x],
        value: 0,
      });
    }
    let results = await this.contractService.multicall(
      calls,
      parent.contract.provider
    );

    calls = [];
    for (let x = 0; x <= parent.maxLevel; x++) {
      let seasonInfo = parent.contract.interface.decodeFunctionResult(
        'seasonInfo',
        results[x].returnData[1]
      );

      calls.push(
        {
          reference: 'checkType',
          address: parent.contract.address,
          abi: [parent.contract.interface.getFunction('checkType')],
          method: 'checkType',
          params: [seasonInfo.freeRewardId],
          value: 0,
          allowFailure: true,
        },
        {
          reference: 'checkType',
          address: parent.contract.address,
          abi: [parent.contract.interface.getFunction('checkType')],
          method: 'checkType',
          params: [seasonInfo.premiumRewardId],
          value: 0,
          allowFailure: true,
        }
      );
    }

    let checkTypeResults = await this.contractService.multicall(
      calls,
      parent.contract.provider
    );

    for (let x = 0; x < checkTypeResults.length; x += 2) {
      //check if failed due to 0 id
      //index 0 is free reward, 1 is premium
      //checkTypeResults.length = 2*maxlevel
      let level = 0;
      if (x != 0) {
        level = x / 2;
      }

      let seasonInfo = parent.contract.interface.decodeFunctionResult(
        'seasonInfo',
        results[level].returnData[1]
      );

      let freeReward = null;
      if (seasonInfo.freeRewardId != 0) {
        freeReward =
          await this.battlePassService.createRewardObjWithRewardType(
            seasonInfo.freeRewardId,
            seasonInfo.freeRewardQty,
            parent.creatorId,
            parseInt(checkTypeResults[x].returnData[1])
          );
      }

      let premiumReward = null;
      if (seasonInfo.premiumRewardId != 0) {
        premiumReward =
          await this.battlePassService.createRewardObjWithRewardType(
            seasonInfo.premiumRewardId,
            seasonInfo.premiumRewardQty,
            parent.creatorId,
            parseInt(checkTypeResults[x + 1].returnData[1])
          );
      }

      levelInfo.push({
        level,
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
      let contract = await this.battlePassService.getBattlePassContract(
        creatorId
      );
      let seasonId = await contract.seasonId();
      let maxLevel = await contract.getMaxLevel(seasonId);
      let battlePassDB = await this.battlePassService.getBattlePassDB(
        contract.address
      );
      return { contract, seasonId, battlePassDB, creatorId, maxLevel };
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
      let userAddress: string = context.req.headers['user-address'];
      let contract = await this.battlePassService.getBattlePassContract(
        creatorId,
        true
      );
      let seasonId = await contract.seasonId();

      let missingFields = await this.battlePassService.checkRequiredFields(
        userAddress,
        contract.address,
        level
      );
      if (missingFields != undefined) {
        return {
          success: true,
          missingFields: {
            payment: missingFields.missing_user_payment_options,
            social: missingFields.missing_user_social_options,
          },
        };
      }

      let fee = await this.contractService.getMaticFeeData();
      let tx = await contract.claimReward(
        seasonId,
        userAddress,
        level,
        premium,
        fee
      );
      await contract.provider.waitForTransaction(tx.hash, 1);

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
      let rewardTypeIdx = await contract.checkType(id);
      let rewardType = await this.battlePassService.getRewardType(
        rewardTypeIdx
      );
      if (rewardType === RewardType.REDEEMABLE && autoRedeem) {
        await this.battlePassService.redeemItemHelper(
          contract,
          id.toNumber(),
          userAddress,
          creatorId,
          contract.address
        );
      } else if (rewardType === RewardType.LOOTBOX) {
        let rewards = await this.battlePassService.openLootbox(
          fee,
          contract,
          id,
          userAddress,
          creatorId
        );
        return { success: true, reward: rewards };
      }

      let reward = await this.battlePassService.createRewardObj(
        contract,
        id,
        qty,
        creatorId
      );
      return { success: true, reward: [reward] };
  }

  @Mutation()
  async redeemReward(
    @Args('creatorId') creatorId: number,
    @Args('itemId') itemId: number,
    @Context() context
  ) {
    let userAddress: string = context.req.headers['user-address'];

    let contract = await this.battlePassService.getBattlePassContract(
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
  }
}
