import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ethers } from 'ethers';
import { BattlepassService } from 'src/battlepass/battlepass.service';
import { ContractService } from 'src/contract/contract.service';
import { RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import { rewardTypeArray } from 'src/types/rewardTypeArray';
import { GetInventoryChildDto } from './dto/GetInventoryChild.dto';
import { InventoryService } from './inventory.service';

@Resolver('Inventory')
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private contractService: ContractService,
    private metadataService: MetadataService,
    private battlePassService: BattlepassService
  ) {}

  @ResolveField()
  async default(@Parent() parent: GetInventoryChildDto) {
    try {
      let contract = await this.battlePassService.getPassContract(
        parent.creatorId
      );
      let owned = await this.inventoryService.getNFTSOwnedForUser(
        [contract.address],
        parent.userAddress
      );
      let defaultReward = [];
      //pagination needs to be handled
      for (let x = 0; x < owned.totalCount; x++) {
        let reward = await this.battlePassService.getRewardForLevel(
          contract,
          owned[x].id.tokenId,
          owned[x].balance
        );
        defaultReward.push({ reward });
      }

      let creatorToken = await this.contractService.find({
        creator_id: parent.creatorId,
        ctr_type: 'CreatorToken',
      });

      let tokenContract =
        this.contractService.getProviderContract(creatorToken);
      let reward = await this.battlePassService.getRewardForLevel(
        tokenContract,
        await contract.CREATOR_TOKEN_ID(),
        await tokenContract.balanceOf(parent.userAddress)
      );
      defaultReward.push({ reward });
      return defaultReward;
    } catch (e) {
      return null;
    }
  }

  @ResolveField()
  //get all tickets for a user and creator
  redeemed() {}

  @Query()
  getInventory(
    @Context() context,
    @Args('creatorId') creatorId: number
  ): GetInventoryChildDto {
    let userAddress: string = context.req.headers['user-address'];
    return { creatorId, userAddress };
  }
}
