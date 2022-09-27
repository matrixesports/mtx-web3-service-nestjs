import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ChainService } from 'src/chain/chain.service';
import { GetLootdropDto } from './reward.dto';
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { Lootdrop } from 'src/graphql.schema';

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
            option[0].ids[y].toNumber(),
            option[0].qtys[y].toNumber(),
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
  }
}

@Resolver('Lootdrop')
export class LootdropResolver {
  private readonly logger = new Logger(LootdropResolver.name);
  constructor(
    private chainService: ChainService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private battlePassService: BattlePassService,
  ) {}

  @Query((of) => Lootdrop, { name: 'getLootdrop' })
  async getlootdrop(
    @Args('creatorId') creatorId: number,
  ): Promise<GetLootdropDto> {
    let lootdrop: GetLootdropDto;
    console.log('fdsas');
    try {
      lootdrop = await this.cacheManager.get<GetLootdropDto>(
        `lootdrop-${creatorId}`,
      );
    } catch (error) {
      this.logger.error({
        operation: 'Cache Read',
        error,
      });
    }
    if (lootdrop == null) return null;
    return lootdrop;
  }

  @ResolveField()
  async reward(@Parent() parent: GetLootdropDto) {
    return await this.battlePassService.createRewardObj(
      parent.creatorId,
      parent.rewardId,
      1,
    );
  }
  @ResolveField()
  requirements(@Parent() parent: GetLootdropDto) {
    return parent.requirements;
  }
  @ResolveField()
  threshold(@Parent() parent: GetLootdropDto) {
    return parent.threshold;
  }
  @ResolveField()
  start(@Parent() parent: GetLootdropDto) {
    return new Date(parent.start);
  }
  @ResolveField()
  end(@Parent() parent: GetLootdropDto) {
    return new Date(parent.end);
  }
}
