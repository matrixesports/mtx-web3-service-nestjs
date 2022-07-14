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
import { Redeemed, RedeemStatus, Reward } from 'src/graphql.schema';
import { GetInventoryChildDto } from './dto/GetInventoryChild.dto';
import { InventoryService } from './inventory.service';
import { Contract as ContractDB } from '../contract/contract.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
      let defaultRewards: Reward[];
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
            ethers.BigNumber.from(owned[y].balance)
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
        let tokenReward = await this.battlePassService.getRewardForLevel(
          contract,
          await tokenContract.balanceOf(parent.userAddress),
          await contract.CREATOR_TOKEN_ID()
        );
        defaultRewards.push(tokenReward);
      }
      return defaultRewards;
    } catch (e) {
      return null;
    }
  }

  @ResolveField()
  //get all tickets for a user
  async redeemed(@Parent() parent: GetInventoryChildDto) {
    try {
      let res = await axios.post(
        `${this.configService.get('SERVICE').user}/api/ticket`,
        parent.userAddress
      );
      let userRedeemedInfo: UserRedeemedRes[] = res.data;
      let redeemed: Redeemed[];
      for (let x = 0; x < userRedeemedInfo.length; x++) {
        let contact = await this.battlePassService.getPassContract(
          userRedeemedInfo[x].creatorId
        );
        let reward = await this.battlePassService.getRewardForLevel(
          contact,
          ethers.BigNumber.from(userRedeemedInfo[x].itemId),
          ethers.BigNumber.from(1)
        );
        redeemed.push({ reward, status: userRedeemedInfo[x].status });
      }
      return redeemed;
    } catch (e) {
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
