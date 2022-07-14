import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ctrtype } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService
  ) {}

  @Query()
  async getLootboxOptions(
    @Args('creatorId') creatorId: number,
    @Args('lootboxId') lootboxId: number
  ) {
    try {
      let contractDB = await this.contractService.findOne({
        creator_id: creatorId,
        ctr_type: ctrtype.BATTLEPASS,
      });
      let contract = this.contractService.getProviderContract(contractDB);
      let lengthOfOptions = await contract.getLootboxOptionsLength(lootboxId);
      let allOptions = [];
      for (let x = 0; x < lengthOfOptions; x++) {
        let option = await contract.getLootboxOptionByIdx(lootboxId, x);
        let rewards = [];
        for (let y = 0; y < option[x].ids.length; y++) {
          let uri = await contract.uri(option[x].ids[y]);
          rewards.push({
            id: option[x].ids[y],
            qty: option[x].qtys[y],
            metadata: await this.metadataService.readFromIPFS(uri),
          });
        }
        allOptions.push({
          rewards,
          probability:
            option.rarityRange[1].toNumber() - option.rarityRange[0].toNumber(),
        });
      }
      return allOptions;
    } catch (e) {
      return null;
    }
  }
}
