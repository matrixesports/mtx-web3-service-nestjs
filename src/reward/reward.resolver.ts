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
import { Logger } from '@nestjs/common';
import { Requirements } from 'src/graphql.schema';
import { Warn } from 'src/common/error.interceptor';
import { LootdropRS } from './reward.entity';
import { GetLootdropDto } from './reward.dto';
import { RewardService } from './reward.service';
import { LeaderboardService } from 'src/leaderboard/leaderboard.service';
import { MetadataService } from 'src/metadata/metadata.service';

@Resolver('LootboxOption')
export class LootboxResolver {
  constructor(
    private chainService: ChainService,
    private metadataService: MetadataService,
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
          await this.metadataService.createRewardObj(
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
    private battlePassService: BattlePassService,
    private rewardService: RewardService,
    private leaderboardService: LeaderboardService,
    private metadataService: MetadataService,
  ) {}

  @Query('getLootdrop')
  async getlootdrop(@Args('creatorId') creatorId: number): Promise<LootdropRS> {
    return this.rewardService.getlootdrop(creatorId);
  }

  @Mutation('claimLootdrop')
  async claimLootdrop(
    @Args('creatorId') creatorId: number,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    const lootdrop = await this.rewardService.getlootdrop(creatorId);
    await this.battlePassService.checkRequiredFields(creatorId, userAddress);
    let userThreshold: number;
    switch (lootdrop.requirements) {
      case Requirements.ALLXP:
        userThreshold = await this.leaderboardService.getOneAllSeasonInfo(
          creatorId,
          userAddress,
        );
        if (userThreshold == null) throw new Error('On-Chain Error!');
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${
              lootdrop.threshold - userThreshold
            } more XP to claim this Lootdrop!`,
          );
        break;
      case Requirements.REPUTATION:
        userThreshold = await this.battlePassService.getBalance(
          creatorId,
          userAddress,
          lootdrop.rewardId,
        );
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${
              lootdrop.threshold - userThreshold
            } more Reputation to claim this Lootdrop!`,
          );
        break;
      case Requirements.SEASONXP:
        userThreshold = await this.battlePassService.getXp(
          creatorId,
          userAddress,
        );
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
    await this.rewardService.setLootdropQty(creatorId, userAddress);

    const bpAddress = await this.battlePassService.getBattlePassAddress(
      creatorId,
    );
    const metadata = await this.metadataService.getMetadata(
      creatorId,
      lootdrop.rewardId,
    );
    await this.battlePassService.redeemItemHelper(
      lootdrop.rewardId,
      userAddress,
      creatorId,
      bpAddress,
      metadata,
    );
    return { success: true };
  }

  @ResolveField()
  async reward(@Parent() parent: GetLootdropDto) {
    return await this.metadataService.createRewardObj(
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

  @ResolveField()
  url(@Parent() parent: GetLootdropDto) {
    return parent.url;
  }
}
