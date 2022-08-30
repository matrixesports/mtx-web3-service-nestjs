import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { BattlePass__factory } from 'abi/typechain';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battle-pass/battle-pass.service';
import { ChainService } from 'src/chain/chain.service';
import { GetSeasonXpRankingDto } from './dto/leaderboard.dto';
import { LeaderboardService } from './leaderboard.service';

@Resolver('Recipe')
export class LeaderboardResolver {
  constructor(
    private chainService: ChainService,
    private leaderboardService: LeaderboardService,
    private battlePassService: BattlePassService,
  ) {}

  /*
|========================| QUERY |========================|
*/
  @Query()
  async getSeasonXpRanking(
    @Args('creatorId') creatorId: number,
    @Args('seasonId') seasonId: number,
  ) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const res = await this.leaderboardService.getFollowers(creatorId);
    const iface = BattlePass__factory.createInterface();
    const fragment = iface.getFunction('userInfo');
    const calls: ContractCall[] = [];
    for (let i = 0; i < res.data.length; i++) {
      const follower = res.data[i];
      calls.push({
        reference: 'userInfo',
        address: contract.address,
        abi: [fragment],
        method: 'userInfo',
        params: [follower.id, seasonId],
        value: 0,
      });
    }

    const results = await this.chainService.multicall(calls);
    if (!results) return null;
    const dtos: GetSeasonXpRankingDto[] = [];
    for (let i = 0; i < results.length; i++) {
      const follower = res.data[i];
      const userInfo = iface.decodeFunctionResult(
        'userInfo',
        results[i].returnData[1],
      );
      dtos.push({
        id: follower.id,
        pfp: follower?.pfp,
        name: follower?.name,
        seasonXp: userInfo.xp.toNumber(),
      });
    }
  }

  /*
|========================| FIELDS |========================|
*/
}
