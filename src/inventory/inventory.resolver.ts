import { ConfigService } from '@nestjs/config';
import {
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { ethers } from 'ethers';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { CreatorToken } from 'src/common/typechain';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { Redeemed, RedeemStatus, Reward, RewardType } from 'src/graphql.schema';
import { Repository } from 'typeorm';
import { Contract as ContractDB } from '../contract/contract.entity';
import { GetInventoryChildDto } from './dto/GetInventoryChild.dto';
import { InventoryService } from './inventory.service';

@Resolver('Inventory')
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private contractService: ContractService,
    private battlePassService: BattlePassService,
    private configService: ConfigService,
    @InjectRepository(ContractDB)
    private contractRepository: Repository<ContractDB>
  ) {}

  @ResolveField()
  /**
   *
   */
  async default(@Parent() parent: GetInventoryChildDto) {
    try {
      let defaultRewards: Reward[] = [];
      let allBattlePasses = await this.contractRepository.find({
        where: { ctr_type: CtrType.BATTLE_PASS },
      });

      for (let x = 0; x < allBattlePasses.length; x++) {
        let contract = await this.battlePassService.getBattlePassContract(
          allBattlePasses[x].creator_id
        );
        let owned = await this.inventoryService.getNFTSOwnedForUser(
          [allBattlePasses[x].address],
          parent.userAddress
        );

        for (let y = 0; y < owned.length; y++) {
          let reward = await this.battlePassService.createRewardObj(
            contract,
            ethers.BigNumber.from(owned[y].id.tokenId),
            ethers.BigNumber.from(owned[y].balance),
            allBattlePasses[x].creator_id
          );
          defaultRewards.push(reward);
        }

        try {
          //handle creator token now
          let creatorTokenDB = await this.contractService.findOne({
            ctr_type: CtrType.CREATOR_TOKEN,
            creator_id: allBattlePasses[x].creator_id,
          });

          let tokenContract = this.contractService.getProviderContract(
            creatorTokenDB
          ) as CreatorToken;
          let balance = await tokenContract.balanceOf(parent.userAddress);
          if (balance.toNumber() == 0) continue;
          let tokenReward =
            await this.battlePassService.createRewardObjWithRewardType(
              await contract.CREATOR_TOKEN_ID(),
              balance,
              creatorTokenDB.creator_id,
              Object.keys(RewardType).indexOf('CREATOR_TOKEN')
            );
          defaultRewards.push(tokenReward);
        } catch (e) {
          continue;
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
      let res = await axios.get(
        `${this.configService.get('SERVICE').ticket}/api/ticket`,
        { params: { userAddress: parent.userAddress } }
      );
      let userRedeemedInfo: UserRedeemedRes[] = res.data;
      let redeemed: Redeemed[] = [];
      //creatorid->itemId->statuses
      let temp = {};

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
          userRedeemedInfo[x].status
        );
      }

      for (const creatorId in temp) {
        for (const itemId in temp[creatorId]) {
          // qty is length of statuses to signify how many have been redeemed
          let reward =
            await this.battlePassService.createRewardObjWithRewardType(
              ethers.BigNumber.from(itemId),
              ethers.BigNumber.from(temp[creatorId][itemId].length),
              parseInt(creatorId),
              Object.keys(RewardType).indexOf('REDEEMABLE')
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
    let userAddress: string = context.req.headers['user-address'];
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
