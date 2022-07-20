import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService,
    private battlePassService: BattlePassService
  ) {}

  @Query()
  async getLootboxOptions(
    @Args('creatorId') creatorId: number,
    @Args('lootboxId') lootboxId: number
  ) {
    try {
      let contractDB = await this.contractService.findOne({
        creator_id: creatorId,
        ctr_type: CtrType.BATTLE_PASS,
      });
      let contract = this.contractService.getProviderContract(contractDB);
      let lengthOfOptions = await contract.getLootboxOptionsLength(lootboxId);
      let allOptions = [];
      for (let x = 0; x < lengthOfOptions; x++) {
        let option = await contract.getLootboxOptionByIdx(lootboxId, x);
        let rewards = [];
        for (let y = 0; y < option[1].length; y++) {
          rewards.push(
            await this.battlePassService.getRewardForLevel(
              contract,
              option[1][y],
              option[2][y],
              creatorId
            )
          );
        }
        allOptions.push({
          rewards,
          probability: option[0][1].toNumber() - option[0][0].toNumber(),
        });
      }
      return allOptions;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
