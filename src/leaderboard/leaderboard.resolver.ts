import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BattlePass__factory } from 'abi/typechain';
import { userInfo } from 'os';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { GetSeasonXpRankingDto } from './dto/leaderboard.dto';
import { LeaderboardService } from './leaderboard.service';

@Resolver('Ranking')
export class LeaderboardResolver {
  constructor(
    private chainService: ChainService,
    private leaderboardService: LeaderboardService,
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
        params: [follower.userAddress, seasonId],
        value: 0,
      });
    }
    const results = await this.chainService.multicall(calls);
    if (!results) return null;
    const dtos: GetSeasonXpRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < results.length; i++) {
      const follower = res.data[i];
      const userInfo = iface.decodeFunctionResult(
        'userInfo',
        results[i].returnData[1],
      );
      others.push({
        total: userInfo.xp.toNumber(),
        userAddress: follower.userAddress,
      });
      dtos.push({
        id: follower.id,
        userAddress: follower.userAddress,
        pfp: follower?.pfp,
        name: follower?.name,
        total: userInfo.xp.toNumber(),
        others,
      });
    }
    others.sort((a, b) => b.total - a.total);
    return dtos;
  }

  @Query()
  async getReputationRanking(@Args('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const res = await this.leaderboardService.getFollowers(creatorId);
    const addresses = [];
    const ids = [];
    for (let i = 0; i < res.data.length; i++) {
      const follower = res.data[i];
      addresses.push(follower.userAddress);
      ids.push(1000);
    }
    const results = await contract.balanceOfBatch(addresses, ids);
    console.log(results);
    const dtos: GetSeasonXpRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < results.length; i++) {
      const follower = res.data[i];
      others.push({
        total: results[i].toNumber(),
        userAddress: follower.userAddress,
      });
      dtos.push({
        id: follower.id,
        userAddress: follower.userAddress,
        pfp: follower?.pfp,
        name: follower?.name,
        total: results[i].toNumber(),
        others,
      });
    }
    others.sort((a, b) => b.total - a.total);
    return dtos;
  }

  @Query()
  async getAllXpRanking(@Args('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const res = await this.leaderboardService.getFollowers(creatorId);
    const iface = BattlePass__factory.createInterface();
    const fragment = iface.getFunction('userInfo');
    const seasonId = (await contract.seasonId()).toNumber();
    const calls: ContractCall[] = [];
    for (let i = 0; i < res.data.length; i++) {
      const follower = res.data[i];
      for (let season = 1; season <= seasonId; season++) {
        calls.push({
          reference: 'userInfo',
          address: contract.address,
          abi: [fragment],
          method: 'userInfo',
          params: [follower.userAddress, season],
          value: 0,
        });
      }
    }
    const results = await this.chainService.multicall(calls);
    if (!results) return null;
    const dtos: GetSeasonXpRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < res.data.length; i++) {
      const follower = res.data[i];
      let total = 0;
      for (let season = 0; season < seasonId; season++) {
        const userInfo = iface.decodeFunctionResult(
          'userInfo',
          results[i * seasonId + season].returnData[1],
        );
        total += userInfo.xp.toNumber();
      }
      others.push({ total, userAddress: follower.userAddress });
      dtos.push({
        id: follower.id,
        userAddress: follower.userAddress,
        pfp: follower?.pfp,
        name: follower?.name,
        total,
        others,
      });
    }
    others.sort((a, b) => b.total - a.total);
    return dtos;
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
        (other) => other.userAddress == parent.userAddress,
      ) + 1
    );
  }
  @ResolveField()
  topPercent(@Parent() parent: GetSeasonXpRankingDto) {
    const index = parent.others.findIndex(
      (other) => other.userAddress == parent.userAddress,
    );
    return (index / userInfo.length) * 100;
  }
}
