import { ConfigService } from '@nestjs/config';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';

@Resolver('BattlePass')
export class BattlepassResolver {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService
  ) {}

  @ResolveField()
  name(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  description(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  price(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  currency(@Parent() parent: GetBattlePassChildDto) {
    return 'a';
  }

  @ResolveField()
  endDate(@Parent() parent: GetBattlePassChildDto) {
    return new Date();
  }

  @ResolveField()
  seasonId(@Parent() parent: GetBattlePassChildDto) {
    return parent.seasonId;
  }

  @ResolveField()
  async maxLevel(@Parent() parent: GetBattlePassChildDto) {
    return await parent.contract.getMaxLevel(parent.seasonId);
  }

  @ResolveField()
  async levelInfo(@Parent() parent: GetBattlePassChildDto) {
    let maxLevel = await parent.contract.getMaxLevel(parent.seasonId);
    let levelInfo = [];
    for (let x = 0; x <= maxLevel; x++) {
      let seasonInfo = await parent.contract.seasonInfo(parent.seasonId, x);
      levelInfo.push({
        level: x,
        xpToCompleteLevel: seasonInfo.xpToCompleteLevel,
        freeReward: {
          id: seasonInfo.freeRewardId,
          qty: seasonInfo.freeRewardQty,
          metadata: await this.metadataService.readFromIPFS(
            await parent.contract.uri(seasonInfo.freeRewardId)
          ),
        },
        premiumReward: {
          id: seasonInfo.premiumRewardId,
          qty: seasonInfo.premiumRewardQty,
          metadata: await this.metadataService.readFromIPFS(
            await parent.contract.uri(seasonInfo.premiumRewardId)
          ),
        },
      });
    }
    return levelInfo;
  }

  @ResolveField()
  userInfo(
    @Parent() parent: GetBattlePassChildDto,
    @Args('userAddress') userAddress: string
  ) {
    return {};
  }

  @Query()
  /**
   * return null if cannot find pass contract for creator
   */
  async getBattlePass(
    @Args('creatorId') creatorId: number
  ): Promise<GetBattlePassChildDto> {
    let contractDBEntries = await this.contractService.findForCreator(
      creatorId,
      'BattlePass'
    );
    if (contractDBEntries.length == 0) return null;
    let contract = await this.contractService.getProviderContract(
      contractDBEntries[0]
    );
    let seasonId = await contract.seasonId();
    return { contract, seasonId };
  }
}
