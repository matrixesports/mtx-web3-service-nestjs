import { ConfigService } from '@nestjs/config';
import {
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import axios from 'axios';
import { Redeemed, RedeemStatus, Reward } from 'src/graphql.schema';
import { GetInventoryChildDto } from './inventory.dto';
import { InventoryService } from './inventory.service';

@Resolver('Inventory')
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private configService: ConfigService,
  ) {}

  @ResolveField()
  async default(@Parent() parent: GetInventoryChildDto) {
    const defaultRewards: Reward[] = [];
    const inventory = await this.inventoryService.getInventory(
      parent.userAddress,
    );

    for (let i = 0; i < inventory.length; i++) {
      let reward: Reward;
      try {
        reward = await this.inventoryService.createRewardObj(
          inventory[i].creatorId,
          inventory[i].rewardId,
          inventory[i].qty,
        );
        defaultRewards.push(reward);
      } catch (e) {}
    }
    return defaultRewards;
  }

  @ResolveField()
  //get all tickets for a user
  async redeemed(@Parent() parent: GetInventoryChildDto) {
    const res = await axios.get(
      `${this.configService.get('microservice.ticket.url')}/api/ticket`,
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
        let reward: Reward;
        try {
          reward = await this.inventoryService.createRewardObj(
            parseInt(creatorId),
            parseInt(itemId),
            temp[creatorId][itemId].length,
          );
          redeemed.push({ reward, status: temp[creatorId][itemId] });
        } catch (e) {}
      }
    }
    return redeemed;
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
