import { Args, Context, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { InventoryService } from './inventory.service';

@Resolver('Inventory')
export class InventoryResolver {
  constructor(
    private inventoryService: InventoryService,
    private contractService: ContractService,
    private metadataService: MetadataService
  ) {}

  @ResolveField()
  async default(@Context() context) {
    let userAddress: string = context.req.headers['user-address'];
    if (userAddress == undefined || userAddress == null) return null;
    try {
      userAddress = ethers.utils.getIcapAddress(userAddress);
    } catch (e) {
      return null;
    }

    let battlePassAddys = await this.contractService.findByType('BattlePass');
    let addys = battlePassAddys.map(x => x.address);
    let owned = await this.inventoryService.getNFTSOwnedForUser(
      addys,
      userAddress
    );
    let defaultReward = [];

    for (let x = 0; x < owned.length; x++) {
      let contractDb = await this.contractService.findByAddress(
        owned[x].contract.address
      );
      let contract = await this.contractService.getProviderContract(
        contractDb[0]
      );
      let uri = await contract.uri(owned[x].id.tokenId);
      defaultReward.push({
        id: owned[x].id.tokenId,
        qty: owned[x].balance,
        metadata: await this.metadataService.readFromIPFS(uri),
      });
    }

    let creatorTokenAddys = await this.contractService.findByType(
      'CreatorToken'
    );
    for (let x = 0; x < creatorTokenAddys.length; x++) {
      let contract = await this.contractService.getProviderContract(
        creatorTokenAddys[x]
      );
      let qty = await contract.balanceOf(userAddress);
      defaultReward.push({
        qty,
      });
    }

    return defaultReward;
  }

  @ResolveField()
  redeemed() {}

  @Query()
  async getInventory(@Args('creatorId') creatorId: number) {
    return creatorId;
  }
}
