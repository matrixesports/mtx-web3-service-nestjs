import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { BattlePassService } from './battle-pass.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
    private metadataService: MetadataService,
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
    try {
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
      let results = await this.chainService.multicall(calls);

      for (let x = 0; x < results.length; x++) {
        let seasonInfo = parent.contract.interface.decodeFunctionResult(
          'seasonInfo',
          results[x].returnData[1],
        );

        let freeReward = await this.battlePassService.createRewardObj(
          parent.creatorId,
          seasonInfo.freeRewardId,
          seasonInfo.freeRewardQty,
        );

        let premiumReward = await this.battlePassService.createRewardObj(
          parent.creatorId,
          seasonInfo.premiumRewardId,
          seasonInfo.premiumRewardQty,
        );

        levelInfo.push({
          x,
          xpToCompleteLevel: seasonInfo.xpToCompleteLevel,
          freeReward,
          premiumReward,
        });
      }

      return levelInfo;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetBattlePassChildDto,
    @Context() context,
  ): GetBattlePassUserInfoChildDto {
    let userAddress: string = context.req.headers['user-address'];
    return { ...parent, userAddress };
  }

  @Query()
  async getBattlePass(
    @Args('creatorId') creatorId: number,
  ): Promise<GetBattlePassChildDto> {
    try {
      let contract = await this.chainService.getBattlePassContract(creatorId);
      let seasonId = await contract.seasonId();
      let maxLevel = await contract.getMaxLevel(seasonId);
      let battlePassDB = await this.battlePassService.getBattlePassDB(
        creatorId,
      );
      return {
        contract,
        seasonId,
        battlePassDB,
        creatorId,
        maxLevel: maxLevel.toNumber(),
      };
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
    @Context() context,
  ) {
    try {
      let userAddress: string = context.req.headers['user-address'];
      let contract = await this.chainService.getBattlePassContract(creatorId);
      let bp = await this.chainService.getSignerContract(contract);
      let signer = await this.chainService.getSigner();

      let seasonId = await bp.seasonId();

      let missingFields = await this.battlePassService.checkRequiredFields(
        creatorId,
        userAddress,
        level,
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

      let abi = [bp.interface.getFunction('claimReward')];
      let iface = new ethers.utils.Interface(abi);
      let encodedCall = iface.encodeFunctionData('claimReward', [
        seasonId,
        level,
        premium,
      ]);
      encodedCall += userAddress.substring(2);
      let fee = await this.chainService.getMaticFeeData();
      let txData = {
        to: bp.address,
        data: encodedCall,
        ...fee,
      };
      let tx = await signer.sendTransaction(txData);
      await bp.provider.waitForTransaction(tx.hash, 1);

      let rewardGiven = await bp.seasonInfo(seasonId, level);
      let id;
      let qty;
      if (premium) {
        id = rewardGiven.premium.id;
        qty = rewardGiven.premium.qty;
      } else {
        id = rewardGiven.free.id;
        qty = rewardGiven.free.qty;
      }
      id = id.toNumber();
      qty = qty.toNumber();

      let metadata = await this.metadataService.getMetadata(creatorId, id);

      if (metadata.reward_type === RewardType.REDEEMABLE && autoRedeem) {
        await this.battlePassService.redeemItemHelper(
          id,
          userAddress,
          creatorId,
          bp.address,
          metadata,
        );
        await bp.burn(userAddress, id, 1, fee);
      } else if (metadata.reward_type === RewardType.LOOTBOX) {
        fee['gasLimit'] = 1000000;
        abi = [bp.interface.getFunction('openLootbox')];
        iface = new ethers.utils.Interface(abi);
        encodedCall = iface.encodeFunctionData('openLootbox', [
          id,
          userAddress,
        ]);
        encodedCall += userAddress.substring(2);
        txData = {
          to: bp.address,
          data: encodedCall,
          ...fee,
        };
        tx = await signer.sendTransaction(txData);
        let rc = await tx.wait();
        let event = rc.events?.find((event) => event.event === 'LootboxOpened');
        const [idxOpened] = event.args;
        let option = await contract.getLootboxOptionByIdx(id, idxOpened);
        let rewards = [];
        for (let y = 0; y < option[1].length; y++) {
          rewards.push(
            await this.battlePassService.createRewardObj(
              creatorId,
              option[1][y],
              option[2][y],
            ),
          );
        }

        return { success: true, reward: rewards };
      }

      let reward = await this.battlePassService.createRewardObj(
        creatorId,
        id,
        qty,
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
    @Context() context,
  ) {
    try {
      let userAddress: string = context.req.headers['user-address'];
      let contract = await this.chainService.getBattlePassContract(creatorId);
      let bp = await this.chainService.getSignerContract(contract);
      let metadata = await this.metadataService.getMetadata(creatorId, itemId);
      await this.battlePassService.redeemItemHelper(
        itemId,
        userAddress,
        creatorId,
        bp.address,
        metadata,
      );
      let fee = await this.chainService.getMaticFeeData();
      await bp.burn(userAddress, itemId, 1, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
