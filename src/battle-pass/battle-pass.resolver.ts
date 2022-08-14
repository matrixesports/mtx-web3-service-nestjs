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
import { BigNumber, ethers } from 'ethers';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { BattlePassService } from './battle-pass.service';
import { GetBattlePassChildDto } from './dto/getBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/getBattlePassUserInfoChild.dto';

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
      const levelInfo = [];
      const calls: ContractCall[] = [];
      for (let x = 0; x <= parent.maxLevel.toNumber(); x++) {
        calls.push({
          reference: 'seasonInfo',
          address: parent.contract.address,
          abi: [parent.contract.interface.getFunction('seasonInfo')],
          method: 'seasonInfo',
          params: [parent.seasonId, x],
          value: 0,
        });
      }
      const results = await this.chainService.multicall(calls);
      for (let x = 0; x < results.length; x++) {
        const seasonInfo = parent.contract.interface.decodeFunctionResult(
          'seasonInfo',
          results[x].returnData[1],
        );
        const freeReward = await this.battlePassService.createRewardObj(
          parent.creatorId,
          seasonInfo.freeRewardId,
          seasonInfo.freeRewardQty,
        );

        const premiumReward = await this.battlePassService.createRewardObj(
          parent.creatorId,
          seasonInfo.premiumRewardId,
          seasonInfo.premiumRewardQty,
        );

        levelInfo.push({
          level: x,
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
    const userAddress: string = context.req.headers['user-address'];
    return { ...parent, userAddress };
  }

  @Query()
  async getBattlePass(
    @Args('creatorId') creatorId: number,
  ): Promise<GetBattlePassChildDto> {
    try {
      const contract = await this.chainService.getBattlePassContract(creatorId);
      const seasonId = await contract.seasonId();
      const maxLevel = await contract.getMaxLevel(seasonId);
      const battlePassDB = await this.battlePassService.getBattlePassDB(
        creatorId,
      );
      return {
        contract,
        seasonId,
        battlePassDB,
        creatorId,
        maxLevel,
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
      const userAddress: string = context.req.headers['user-address'];
      const contract = await this.chainService.getBattlePassContract(creatorId);
      const bp = this.chainService.getSignerContract(contract) as BattlePass;

      const seasonId = await bp.seasonId();

      const missingFields = await this.battlePassService.checkRequiredFields(
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
      console.log(missingFields);
      const abi = [bp.interface.getFunction('claimReward')];
      const iface = new ethers.utils.Interface(abi);
      let encodedCall = iface.encodeFunctionData('claimReward', [
        seasonId,
        level,
        premium,
      ]);
      encodedCall += userAddress.substring(2);
      const fee = await this.chainService.getMaticFeeData();
      const txData = {
        to: bp.address,
        data: encodedCall,
        ...fee,
      };
      const tx = await bp.signer.sendTransaction(txData);
      await bp.provider.waitForTransaction(tx.hash, 1);
      console.log('claim tx' + JSON.stringify(tx));
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
        await bp.burn(userAddress, id, 1, fee);
      } else if (metadata.reward_type === RewardType.LOOTBOX) {
        const fee = await this.chainService.getMaticFeeData();
        fee['gasLimit'] = 1000000;
        const abi = [bp.interface.getFunction('openLootbox')];
        const iface = new ethers.utils.Interface(abi);
        let encodedCall = iface.encodeFunctionData('openLootbox', [id]);
        encodedCall += userAddress.substring(2);
        const txData = {
          to: bp.address,
          data: encodedCall,
          ...fee,
        };
        const tx = await bp.signer.sendTransaction(txData);
        console.log('openLoot' + JSON.stringify(tx));
        await bp.provider.waitForTransaction(tx.hash, 1);
        const rc = await bp.provider.getTransactionReceipt(tx.hash);
        console.log('receipt' + JSON.stringify(rc));
        const logs = [];
        for (let i = 0; i < rc.logs.length; i++) {
          try {
            const log = rc.logs[i];
            logs.push(bp.interface.parseLog(log));
          } catch (e) {}
        }
        console.log('logs' + logs);
        const log = logs.find((log: any) => log.name === 'LootboxOpened');
        const idxOpened = log.args.idxOpened.toNumber();
        const option = await contract.getLootboxOptionByIdx(id, idxOpened);
        console.log('option' + option);
        const rewards = [];
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
      const reward = await this.battlePassService.createRewardObj(
        creatorId,
        BigNumber.from(id),
        BigNumber.from(qty),
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
      const userAddress: string = context.req.headers['user-address'];
      const contract = await this.chainService.getBattlePassContract(creatorId);
      const bp = this.chainService.getSignerContract(contract) as BattlePass;
      const metadata = await this.metadataService.getMetadata(
        creatorId,
        itemId,
      );
      await this.battlePassService.redeemItemHelper(
        itemId,
        userAddress,
        creatorId,
        bp.address,
        metadata,
      );
      const fee = await this.chainService.getMaticFeeData();
      await bp.burn(userAddress, itemId, 1, fee);
      return { success: true };
    } catch (e) {
      console.log(e);
      return { success: false };
    }
  }
}
