import { ConfigService } from '@nestjs/config';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import axios from 'axios';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { LevelInfo, RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { rewardTypeArray } from 'src/types/rewardTypeArray';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';
import { GetBattlePassUserInfoChildDto } from './dto/GetBattlePassUserInfoChild.dto';

@Resolver('BattlePass')
export class BattlepassResolver {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService,
    private configService: ConfigService
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
      let freeReward;
      let premiumReward;
      try {
        let freeRewardType = await parent.contract.checkType(
          seasonInfo.freeRewardId
        );
        let rewardType = rewardTypeArray[freeRewardType];
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
        let rewardType = rewardTypeArray[premiumRewardType];
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
    let userAddress: string = context.req.headers['user-address'];
    if (userAddress == undefined || userAddress == null) return null;
    // check if the address is valid
    try {
      userAddress = ethers.utils.getIcapAddress(userAddress);
    } catch (e) {
      return null;
    }

    let contractDB = await this.contractService.findForCreator(
      creatorId,
      'BattlePass'
    );
    if (contractDB.length == 0) return null;
    let contract = this.contractService.getSignerContract(contractDB[0]);
    let seasonId = await contract.seasonId();

    try {
      let fee = await this.contractService.getMaticFeeData();
      await contract.claimReward(seasonId, userAddress, level, premium, fee);
    } catch (e) {
      return { success: false };
    }

    let rewardGiven = await contract.seasonInfo(seasonId, level);
    let id;
    if (premium) {
      id = rewardGiven.premiumRewardId;
    } else {
      id = rewardGiven.freeRewardId;
    }

    let rewardType;
    rewardType = await contract.checkType(id);
    if (rewardTypeArray[rewardType] != RewardType.REDEEMABLE)
      return { success: true };
    if (!autoRedeem) return { success: true };

    try {
      let uri = await contract.uri(id);
      let metadata = await this.metadataService.readFromIPFS(uri);
      let ticket = await axios.post(
        `${this.configService.get('SERVICE').ticket}/api/ticket/redemption`,
        {
          ...metadata,
          creatorId: creatorId,
          itemId: id.toNumber(),
          userAddress: userAddress,
          itemAddress: contractDB[0].address,
        }
      );
      let fee = await this.contractService.getMaticFeeData();
      await contract.redeemReward(
        ticket.data.data.ticketId,
        userAddress,
        id,
        fee
      );
    } catch (e) {
      return { success: false };
    }
  }

  @Mutation()
  /**
   */
  async redeemReward(
    @Args('creatorId') creatorId: number,
    @Args('itemId') itemId: number,
    @Context() context
  ) {
    let userAddress: string = context.req.headers['user-address'];
    if (userAddress == undefined || userAddress == null) return null;
    // check if the address is valid
    try {
      userAddress = ethers.utils.getIcapAddress(userAddress);
    } catch (e) {
      return null;
    }

    let contractDB = await this.contractService.findForCreator(
      creatorId,
      'BattlePass'
    );
    if (contractDB.length == 0) return null;
    let contract = this.contractService.getSignerContract(contractDB[0]);
    let seasonId = await contract.seasonId();

    try {
      let uri = await contract.uri(itemId);
      let metadata = await this.metadataService.readFromIPFS(uri);
      let ticket = await axios.post(
        `${this.configService.get('SERVICE').ticket}/api/ticket/redemption`,
        {
          ...metadata,
          creatorId: creatorId,
          itemId: itemId,
          userAddress: userAddress,
          itemAddress: contractDB[0].address,
        }
      );
      let fee = await this.contractService.getMaticFeeData();
      let ticketId = ticket.data.data.ticketId;
      ticketId = ticketId.replace('-', '');
      await contract.redeemReward(ticketId, userAddress, itemId, fee);
    } catch (e) {
      return { success: false };
    }
  }
}
