import { Args, Query, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battle-pass/battle-pass.service';
import { ChainService } from 'src/chain/chain.service';

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
  ) {}

  @Query()
  async getLootboxOptions(
    @Args('creatorId') creatorId: number,
    @Args('lootboxId') lootboxId: number,
  ) {
    try {
      const contract = await this.chainService.getBattlePassContract(creatorId);
      const lengthOfOptions = await contract.getLootboxOptionsLength(lootboxId);
      const allOptions = [];
      const calls: ContractCall[] = [];

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
      const results = await this.chainService.multicall(calls);
      for (let x = 0; x < lengthOfOptions.toNumber(); x++) {
        //for some reason it return an array lol
        //arrays have len 1. keep an eye out for this
        const option = contract.interface.decodeFunctionResult(
          'getLootboxOptionByIdx',
          results[x].returnData[1],
        );
        const rewardsInOption = [];
        for (let y = 0; y < option[0].ids.length; y++) {
          rewardsInOption.push(
            await this.battlePassService.createRewardObj(
              creatorId,
              option[0].ids[y],
              option[0].qtys[y],
            ),
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
