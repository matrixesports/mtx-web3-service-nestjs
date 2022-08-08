import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ChainService } from 'src/chain/chain.service';
import { BattlePassService } from './battle-pass.service';
import { GetBattlePassChildDto } from './dto/GetBattlePassChild.dto';

@Resolver('BattlePass')
export class BattlePassResolver {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
  ) {}

  @ResolveField()
  name(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.name;
  }

  @ResolveField()
  description(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.description;
  }

  @ResolveField()
  price(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.price;
  }

  @ResolveField()
  currency(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.currency;
  }

  @ResolveField()
  endDate(@Parent() parent: GetBattlePassChildDto) {
    return parent.battlePassDB.end_date;
  }

  @ResolveField()
  seasonId(@Parent() parent: GetBattlePassChildDto) {
    return parent.seasonId;
  }

  @ResolveField()
  async maxLevel(@Parent() parent: GetBattlePassChildDto) {
    return parent.maxLevel;
  }

  @Query()
  async getBattlePass(
    @Args('creatorId') creatorId: number,
  ): Promise<GetBattlePassChildDto> {
    try {
      let contract = await this.chainService.getBattlePassContract(creatorId);
      let seasonId = await contract.seasonId();
      let maxLevel = await contract.getMaxLevel(seasonId);
      let battlePassDB = await this.battlePassService.getBattlePassDB(
        creatorId,
      );
      return { contract, seasonId, battlePassDB, creatorId, maxLevel };
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
