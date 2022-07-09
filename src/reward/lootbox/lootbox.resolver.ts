import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService
  ) {}

  @ResolveField()
  probability() {}

  @ResolveField()
  reward() {}

  @Query()
  async getLootboxOptions(
    @Args('creatorId') creatorId: number,
    @Args('lootboxId') lootboxId: number
  ) {
    let contractDB = await this.contractService.findForCreator(
      creatorId,
      'BattlePass'
    );
    if (contractDB.length == 0) return null;
    let contract = this.contractService.getProviderContract(contractDB[0]);
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
  }
}