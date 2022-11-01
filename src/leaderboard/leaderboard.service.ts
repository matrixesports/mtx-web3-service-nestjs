import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BattlePass__factory } from 'abi/typechain';
import axios from 'axios';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { GetSeasonXpRankingDto } from './leaderboard.dto';

@Injectable()
export class LeaderboardService {
  REPUTATION_ID = 1000;
  constructor(
    private configService: ConfigService,
    private chainService: ChainService,
  ) {}

  /*
|========================| WEB3 CALLS |========================|
*/

  async getReputationInfo(creatorId: number, followers: any[]) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const addresses = [];
    const ids = [];
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
      addresses.push(follower.userAddress);
      ids.push(this.REPUTATION_ID);
    }
    const results = await contract.balanceOfBatch(addresses, ids);
    const dtos: GetSeasonXpRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < results.length; i++) {
      const follower = followers[i];
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

  async getSeasonInfo(creatorId: number, seasonId: number, followers: any[]) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const iface = BattlePass__factory.createInterface();
    const fragment = iface.getFunction('userInfo');
    const calls: ContractCall[] = [];
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
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
    if (results == null) return null;
    const dtos: GetSeasonXpRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < results.length; i++) {
      const follower = followers[i];
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

  async getAllSeasonInfo(creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const followers = await this.getFollowers(creatorId);
    const iface = BattlePass__factory.createInterface();
    const fragment = iface.getFunction('userInfo');
    const seasonId = (await contract.seasonId()).toNumber();
    const calls: ContractCall[] = [];
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
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
    if (results == null) return null;
    const dtos: GetSeasonXpRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
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

  async getOneAllSeasonInfo(creatorId: number, userAddress: string) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const iface = BattlePass__factory.createInterface();
    const fragment = iface.getFunction('userInfo');
    const seasonId = (await contract.seasonId()).toNumber();
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
    let xp = 0;
    if (results == null) return null;
    for (let i = 0; i < seasonId; i++) {
      const userInfo = iface.decodeFunctionResult(
        'userInfo',
        results[i].returnData[1],
      );
      xp += userInfo.xp.toNumber();
    }
    return xp;
  }
  /*
|========================| SERVICE CALLS |========================|
*/

  async getFollowers(creatorId: number) {
    // const res = { data: [] };
    // res.data.push({
    //   userAddress: 'E0c788889AaBeAd8D4181d14b2868E7720AE1c26',
    //   id: 10,
    //   pfp: 'pfp',
    //   name: 'name',
    // });
    // res.data.push({
    //   userAddress: '0000000000000000000000000000000000000001',
    //   id: 11,
    //   pfp: 'pfp1',
    //   name: 'name1',
    // });
    // return res.data;
    const res = await axios
      .get(
        `${this.configService.get<string>(
          'microservice.discord.host',
        )}/api/creator/${creatorId}/followers`,
      )
      .catch((error) => {
        throw new Error('Fetching Leaderboard Failed!');
      });
    return res.data;
  }
}
