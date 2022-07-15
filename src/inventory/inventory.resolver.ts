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
import { ctrtype } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { Redeemed, RedeemStatus, Reward, RewardType } from 'src/graphql.schema';
import { GetInventoryChildDto } from './dto/GetInventoryChild.dto';
import { InventoryService } from './inventory.service';
import { Contract as ContractDB } from '../contract/contract.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rewardTypeArray } from 'src/types/rewardTypeArray';

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
  async default(@Parent() parent: GetInventoryChildDto) {
    try {
      let defaultRewards: Reward[] = [];
      //get all creators
      let allBattlePasses = await this.contractRepository.find({
        where: { ctr_type: ctrtype.BATTLEPASS },
      });

      for (let x = 0; x < allBattlePasses.length; x++) {
        //for each pass, return nfts and token owned by user
        let contract = await this.battlePassService.getPassContract(
          allBattlePasses[x].creator_id
        );
        let owned = await this.inventoryService.getNFTSOwnedForUser(
          [allBattlePasses[x].address],
          parent.userAddress
        );

        for (let y = 0; y < owned.length; y++) {
          let reward = await this.battlePassService.getRewardForLevel(
            contract,
            ethers.BigNumber.from(owned[y].id.tokenId),
            ethers.BigNumber.from(owned[y].balance),
            allBattlePasses[x].creator_id
          );
          defaultRewards.push(reward);
        }

        //handle creator token now
        let creatorTokenDB = await this.contractService.findOne({
          ctr_type: ctrtype.CREATORTOKEN,
          creator_id: allBattlePasses[x].creator_id,
        });
        let tokenContract = await this.contractService.getProviderContract(
          creatorTokenDB
        );
        let balance = await tokenContract.balanceOf(parent.userAddress);
        if (balance == 0) continue;
        let tokenReward = await this.battlePassService.getRewardForLevel(
          contract,
          balance,
          await contract.CREATOR_TOKEN_ID(),
          creatorTokenDB.creator_id
        );
        defaultRewards.push(tokenReward);
      }
      return defaultRewards;
    } catch (e) {
      return [];
    }
  }

  @ResolveField()
  //get all tickets for a user
  async redeemed(@Parent() parent: GetInventoryChildDto) {
    try {
      let res = await axios.get(
        `${this.configService.get('SERVICE').user}/api/ticket`,
        { params: { userAddress: parent.userAddress } }
      );
      let userRedeemedInfo: UserRedeemedRes[] = res.data;
      let redeemed: Redeemed[];
      //creatorid->itemId->statuses
      let temp = {};
      for (let x = 0; x < userRedeemedInfo.length; x++) {
        temp[userRedeemedInfo[x].creatorId][userRedeemedInfo[x].itemId].push(
          userRedeemedInfo[x].status
        );
      }
      console.log(temp);
      for (const creatorId in temp) {
        let contract = await this.battlePassService.getPassContract(
          parseInt(creatorId)
        );
        for (const itemId in temp[creatorId]) {
          // qty is length of statuses to signify how many have been redeemed
          let reward = await this.battlePassService.getRewardForLevel(
            contract,
            ethers.BigNumber.from(temp[creatorId][itemId].length),
            ethers.BigNumber.from(itemId),
            parseInt(creatorId)
          );
          redeemed.push({ reward, status: temp[creatorId[itemId]] });
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
