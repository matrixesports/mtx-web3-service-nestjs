import { ConfigService } from '@nestjs/config';
import {
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import axios from 'axios';
import { ethers } from 'ethers';
import { BattlePassService } from 'src/battle-pass/battle-pass.service';
import { ChainService } from 'src/chain/chain.service';
import { Redeemed, RedeemStatus, Reward, RewardType } from 'src/graphql.schema';
import { GetInventoryChildDto } from './dto/GetInventoryChild.dto';
import { InventoryService } from './inventory.service';

@Resolver('Inventory')
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private battlePassService: BattlePassService,
    private configService: ConfigService,
    private chainService: ChainService,
  ) {}

  @ResolveField()
  async default(@Parent() parent: GetInventoryChildDto) {
    try {
      const defaultRewards: Reward[] = [];
      const allBattlePasses = await this.battlePassService.findAll();

      for (let x = 0; x < allBattlePasses.length; x++) {
        const contract = await this.chainService.getBattlePassContract(
          allBattlePasses[x].creator_id,
        );

        const owned = await this.inventoryService.getNFTSOwnedForUser(
          [contract.address],
          parent.userAddress,
        );

        for (let y = 0; y < owned.length; y++) {
          const reward = await this.battlePassService.createRewardObj(
            allBattlePasses[x].creator_id,
            ethers.BigNumber.from(owned[y].id.tokenId),
            ethers.BigNumber.from(owned[y].balance),
          );
          defaultRewards.push(reward);
        }
      }
      return defaultRewards;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  @ResolveField()
  //get all tickets for a user
  async redeemed(@Parent() parent: GetInventoryChildDto) {
    try {
      const res = await axios.get(
        `${this.configService.get('SERVICE').ticket}/api/ticket`,
        { params: { userAddress: parent.userAddress } },
      );
      const userRedeemedInfo: UserRedeemedRes[] = res.data;
      const redeemed: Redeemed[] = [];
      //creatorid->itemId->statuses
      const temp = {};

      for (let x = 0; x < userRedeemedInfo.length; x++) {
        if (temp[userRedeemedInfo[x].creatorId] === undefined) {
          temp[userRedeemedInfo[x].creatorId] = {};
        }
        if (
          temp[userRedeemedInfo[x].creatorId][userRedeemedInfo[x].itemId] ===
          undefined
        ) {
          temp[userRedeemedInfo[x].creatorId][userRedeemedInfo[x].itemId] = [];
        }
        temp[userRedeemedInfo[x].creatorId][userRedeemedInfo[x].itemId].push(
          userRedeemedInfo[x].status,
        );
      }

      for (const creatorId in temp) {
        for (const itemId in temp[creatorId]) {
          // qty is length of statuses to signify how many have been redeemed
          const reward = await this.battlePassService.createRewardObj(
            parseInt(creatorId),
            ethers.BigNumber.from(itemId),
            ethers.BigNumber.from(temp[creatorId][itemId].length),
          );
          redeemed.push({ reward, status: temp[creatorId][itemId] });
        }
      }
      return redeemed;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  @Query()
  getInventory(@Context() context): GetInventoryChildDto {
    const userAddress: string = context.req.headers['user-address'];
    return {
      userAddress,
    };
  }
}

interface UserRedeemedRes {
  itemId: number;
  creatorId: number;
  status: RedeemStatus;
}
