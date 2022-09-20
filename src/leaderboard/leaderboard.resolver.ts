import {
  Args,
  Context,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GetSeasonXpRankingDto } from './leaderboard.dto';
import { LeaderboardService } from './leaderboard.service';

@Resolver('Ranking')
export class LeaderboardResolver {
  constructor(private leaderboardService: LeaderboardService) {}

  /*
|========================| QUERY |========================|
*/
  @Query()
  async getSeasonXpRanking(
    @Args('creatorId') creatorId: number,
    @Args('seasonId') seasonId: number,
  ) {
    const followers = await this.leaderboardService.getFollowers(creatorId);
    return await this.leaderboardService.getSeasonInfo(
      creatorId,
      seasonId,
      followers,
    );
  }

  @Query()
  async getReputationRankings(@Args('creatorId') creatorId: number) {
    const followers = await this.leaderboardService.getFollowers(creatorId);
    return await this.leaderboardService.getReputationInfo(
      creatorId,
      followers,
    );
  }

  @Query()
  async getReputationRanking(
    @Args('creatorId') creatorId: number,
    @Context() context,
  ) {
    const userAddress: string = context.req.headers['user-address'];
    const followers = await this.leaderboardService.getFollowers(creatorId);
    const repInfos = await this.leaderboardService.getReputationInfo(
      creatorId,
      followers,
    );
    return repInfos.find((info) => info.userAddress === userAddress);
  }

  @Query()
  async getAllXpRanking(@Args('creatorId') creatorId: number) {
    return await this.leaderboardService.getAllSeasonInfo(creatorId);
  }

  /*
|========================| FIELDS |========================|
*/

  @ResolveField()
  name(@Parent() parent: GetSeasonXpRankingDto) {
    return parent.name;
  }

  @ResolveField()
  pfp(@Parent() parent: GetSeasonXpRankingDto) {
    return parent.pfp;
  }

  @ResolveField()
  rank(@Parent() parent: GetSeasonXpRankingDto) {
    return (
      parent.others.findIndex(
        (other) => other.userAddress === parent.userAddress,
      ) + 1
    );
  }
  @ResolveField()
  topPercent(@Parent() parent: GetSeasonXpRankingDto) {
    const index = parent.others.findIndex(
      (other) => other.userAddress === parent.userAddress,
    );
    return (
      100 -
      Math.round(((parent.others.length - index) / parent.others.length) * 100)
    );
  }
}
