import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ethers } from 'ethers';
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
    private metadataService: MetadataService
  ) {}

  @ResolveField()
  async default(@Parent() parent: GetInventoryChildDto) {
    let contarctDB = await this.contractService.findForCreator(
      parent.creatorId,
      'BattlePass'
    );
    if (contarctDB.length == 0) return null;
    let contract = await this.contractService.getProviderContract(
      contarctDB[0]
    );

    let owned = await this.inventoryService.getNFTSOwnedForUser(
      [contarctDB[0].address],
      parent.userAddress
    );
    if (owned == null) return null;

    let defaultReward = [];
    //pagination needs to be handled
    for (let x = 0; x < owned.totalCount; x++) {
      let uri = await contract.uri(owned[x].id.tokenId);
      let rewardType = await contract.checkType(owned[x].id.tokenId);
      defaultReward.push({
        id: owned[x].id.tokenId,
        qty: owned[x].balance,
        metadata: await this.metadataService.readFromIPFS(uri),
        rewardType: rewardTypeArray[rewardType],
      });
    }

    let creatorToken = await this.contractService.findForCreator(
      parent.creatorId,
      'CreatorToken'
    );

    let tokenContract = this.contractService.getProviderContract(
      creatorToken[0]
    );
    let id = await contract.CREATOR_TOKEN_ID();
    let uri = await contract.uri(id);
    defaultReward.push({
      id,
      qty: await tokenContract.balanceOf(parent.userAddress),
      metadata: await this.metadataService.readFromIPFS(uri),
      rewardType: RewardType.CREATOR_TOKEN,
    });
    return defaultReward;
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
    if (userAddress == undefined || userAddress == null) return null;
    try {
      userAddress = ethers.utils.getIcapAddress(userAddress);
    } catch (e) {
      return null;
    }

    return { creatorId, userAddress };
  }
}
