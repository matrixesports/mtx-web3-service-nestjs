import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ChainService } from 'src/chain/chain.service';
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { Lootdrop, MutationResponse, Requirements } from 'src/graphql.schema';
import { BattlePass, BattlePass__factory } from 'abi/typechain';
import { Warn } from 'src/common/error.interceptor';
import { LootdropRS } from './reward.entity';
import { GetLootdropDto } from './reward.dto';

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
  async getlootdrop(@Args('creatorId') creatorId: number): Promise<LootdropRS> {
    let lootdrop: LootdropRS;
    try {
      lootdrop = await this.cacheManager.get<LootdropRS>(
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

  @Mutation((of) => MutationResponse, { name: 'claimLootdrop' })
  async claimLootdrop(
    @Args('creatorId') creatorId: number,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    let lootdrop: LootdropRS;
    try {
      lootdrop = await this.cacheManager.get<LootdropRS>(
        `lootdrop-${creatorId}`,
      );
    } catch (error) {
      this.logger.error({
        operation: 'Cache Read',
        error,
      });
    }
    if (lootdrop == null) throw new Warn('Lootdrop Not Active!');
    const contract = await this.chainService.getBattlePassContract(creatorId);
    let userThreshold = 0;
    let seasonId: number;
    switch (lootdrop.requirements) {
      case Requirements.ALLXP:
        const iface = BattlePass__factory.createInterface();
        const fragment = iface.getFunction('userInfo');
        seasonId = (await contract.seasonId()).toNumber();
        const calls: ContractCall[] = [];
        for (let season = 1; season <= seasonId; season++) {
          calls.push({
            reference: 'userInfo',
            address: contract.address,
            abi: [fragment],
            method: 'userInfo',
            params: [userAddress, season],
            value: 0,
          });
        }
        const results = await this.chainService.multicall(calls);
        if (results == null) throw new Warn('Reading XP Failed!');
        for (let i = 0; i < seasonId; i++) {
          const userInfo = iface.decodeFunctionResult(
            'userInfo',
            results[i].returnData[1],
          );
          userThreshold += userInfo.xp.toNumber();
        }
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${
              lootdrop.threshold - userThreshold
            } more XP to claim this Lootdrop!`,
          );
        break;
      case Requirements.REPUTATION:
        userThreshold = (
          await contract.balanceOf(userAddress, lootdrop.rewardId)
        ).toNumber();
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${
              lootdrop.threshold - userThreshold
            } more Reputation to claim this Lootdrop!`,
          );
        break;
      case Requirements.SEASONXP:
        seasonId = (await contract.seasonId()).toNumber();
        userThreshold = (
          await contract.userInfo(userAddress, seasonId)
        ).xp.toNumber();
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${
              lootdrop.threshold - userThreshold
            } more XP to claim this Lootdrop!`,
          );
        break;
      default:
        throw new Error('Invalid Lootdrop!');
    }
    if (userThreshold < lootdrop.threshold)
      throw new Warn('User Cannot Meet Requirements!');
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (await bp.mint(userAddress, lootdrop.rewardId, 1, fee)).wait(1);
    return { success: true };
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
