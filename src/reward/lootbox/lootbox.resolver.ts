import { Args, Query, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlePassService
  ) {}

  @Query()
  async getLootboxOptions(
    @Args('creatorId') creatorId: number,
    @Args('lootboxId') lootboxId: number
  ) {
    try {
      let contract = await this.battlePassService.getBattlePassContract(
        creatorId
      );
      let lengthOfOptions = await contract.getLootboxOptionsLength(lootboxId);
      let allOptions = [];
      let calls: ContractCall[] = [];

      for (let x = 0; x < lengthOfOptions.toNumber(); x++) {
        calls.push({
          reference: 'getLootboxOptionByIdx',
          address: contract.address,
          abi: [contract.interface.getFunction('getLootboxOptionByIdx')],
          method: 'getLootboxOptionByIdx',
          params: [lootboxId, x],
          value: 0,
        });
      }
      let results = await this.contractService.multicall(
        calls,
        contract.provider
      );
      for (let x = 0; x < lengthOfOptions.toNumber(); x++) {
        //for some reason it return an array lol
        //arrays have len 1. keep an eye out for this
        let option = contract.interface.decodeFunctionResult(
          'getLootboxOptionByIdx',
          results[x].returnData[1]
        );
        let rewardsInOption = [];
        for (let y = 0; y < option[0].ids.length; y++) {
          rewardsInOption.push(
            await this.battlePassService.createRewardObj(
              contract,
              option[0].ids[y],
              option[0].qtys[y],
              creatorId
            )
          );
        }
        allOptions.push({
          reward: rewardsInOption,
          probability:
            option[0].rarityRange[1].toNumber() -
            option[0].rarityRange[0].toNumber(),
        });
      }
      return allOptions;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
