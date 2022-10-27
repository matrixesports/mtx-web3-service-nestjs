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
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ChainService } from 'src/chain/chain.service';
import { Redeemed, RedeemStatus, Reward } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { GetInventoryChildDto } from './inventory.dto';
import { InventoryService } from './inventory.service';

@Resolver('Inventory')
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private battlePassService: BattlePassService,
    private configService: ConfigService,
    private chainService: ChainService,
    private metadataService: MetadataService,
  ) {}

  @ResolveField()
  async default(@Parent() parent: GetInventoryChildDto) {
    const defaultRewards: Reward[] = [];
    const allBattlePasses = await this.battlePassService.getBattlePasses();

    for (let x = 0; x < allBattlePasses.length; x++) {
      const contract = await this.chainService.getBattlePassContract(
        allBattlePasses[x].creator_id,
      );

      const owned = await this.inventoryService.getNFTSOwnedForUser(
        [contract.address],
        parent.userAddress,
      );
      for (let y = 0; y < owned.length; y++) {
        let reward: Reward;
        try {
          reward = await this.metadataService.createRewardObj(
            allBattlePasses[x].creator_id,
            ethers.BigNumber.from(owned[y].id.tokenId).toNumber(),
            parseInt(owned[y].balance),
          );
          defaultRewards.push(reward);
        } catch (e) {}
      }
    }
    return defaultRewards;
  }

  @ResolveField()
  //get all tickets for a user
  async redeemed(@Parent() parent: GetInventoryChildDto) {
    const res = await axios.get(
      `${this.configService.get('SERVICE').ticketService}/api/ticket`,
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
          reward = await this.metadataService.createRewardObj(
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
