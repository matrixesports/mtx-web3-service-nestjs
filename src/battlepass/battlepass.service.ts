import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LevelInfo, Reward, RewardType } from 'src/graphql.schema';
import { DataSource, Repository } from 'typeorm';
import { BattlePassDB } from './battlepass.entity';
import { plainToInstance } from 'class-transformer';
import { GetBattlePassUserInfoChildDto, GetRankingDto } from './battlepass.dto';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { BattlePass, BattlePass__factory } from 'abi/typechain';
import { InventoryService } from 'src/inventory/inventory.service';
import { MicroserviceService } from 'src/microservice/microservice.service';
import { Follower, LeaderboardAlert, LevelUpAlert } from 'src/microservice/microservice.dto';

@Injectable()
export class BattlePassService {
  private readonly logger = new Logger(BattlePassService.name);
  REPUTATION_ID = 1000;
  constructor(
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>,
    @InjectRedis() private readonly redis: Redis,
    private inventoryService: InventoryService,
    private microserviceService: MicroserviceService,
    private chainService: ChainService,
    private dataSource: DataSource,
  ) {}

  /*
|========================| WEB3 CALLS |========================|
*/
  async getLevelInfo(creatorId: number, contract: BattlePass, seasonId: number, maxLevel: number) {
    let levelInfo: LevelInfo[];
    const target = `level-info-${creatorId}`;
    const cache = await this.redis.get(target).catch((error) => {
      this.logger.error('Cache Read', error);
    });
    if (cache == null) {
      levelInfo = [];
      const calls: ContractCall[] = [];
      for (let x = 0; x <= maxLevel; x++) {
        calls.push({
          reference: 'seasonInfo',
          address: contract.address,
          abi: [contract.interface.getFunction('seasonInfo')],
          method: 'seasonInfo',
          params: [seasonId, x],
          value: 0,
        });
      }
      const results = await this.chainService.multicall(calls);
      for (let x = 0; x < results.length; x++) {
        const seasonInfo = contract.interface.decodeFunctionResult(
          'seasonInfo',
          results[x].returnData[1],
        );
        const freeReward = await this.inventoryService.createRewardObj(
          creatorId,
          seasonInfo.freeRewardId.toNumber(),
          seasonInfo.freeRewardQty.toNumber(),
        );

        const premiumReward = await this.inventoryService.createRewardObj(
          creatorId,
          seasonInfo.premiumRewardId.toNumber(),
          seasonInfo.premiumRewardQty.toNumber(),
        );
        levelInfo.push({
          level: x,
          xpToCompleteLevel: seasonInfo.xpToCompleteLevel.toNumber(),
          freeReward,
          premiumReward,
        });
      }
      await this.redis.set(target, JSON.stringify(levelInfo)).catch((error) => {
        this.logger.error('Cache Write', error);
      });
    } else {
      levelInfo = plainToInstance(LevelInfo, JSON.parse(cache as string)) as unknown as LevelInfo[];
    }
    return levelInfo;
  }

  async getUserRewards(dto: GetBattlePassUserInfoChildDto, isPrem: boolean) {
    const userLevel = await dto.contract.level(dto.userAddress, dto.seasonId);
    const calls: ContractCall[] = [];
    const unclaimedFree = [];
    for (let x = 0; x <= userLevel.toNumber(); x++) {
      calls.push({
        reference: 'isRewardClaimed',
        address: dto.contract.address,
        abi: [dto.contract.interface.getFunction('isRewardClaimed')],
        method: 'isRewardClaimed',
        params: [dto.userAddress, dto.seasonId, x, isPrem],
        value: 0,
      });
    }
    const results = await this.chainService.multicall(calls);
    for (let x = 0; x <= userLevel.toNumber(); x++) {
      // todo add typing
      if (!parseInt(results[x].returnData[1])) unclaimedFree.push(x);
    }
    return unclaimedFree;
  }

  async getBalance(creatorId: number, userAddress: string, id: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const balance = (await contract.balanceOf(userAddress, id)).toNumber();
    return balance;
  }

  async getXp(creatorId: number, userAddress: string) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = (await contract.seasonId()).toNumber();
    const xp = (await contract.userInfo(userAddress, seasonId)).xp.toNumber();
    return xp;
  }

  async getSeasonId(creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = (await contract.seasonId()).toNumber();
    return seasonId;
  }

  async mint(creatorId: number, userAddress: string, id: number, qty: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    await bp.callStatic.mint(userAddress, id, qty).catch((err) => {
      throw new Error('Transaction Reverted!');
    });
    const nonce = await this.chainService.getNonce();
    const fee = await this.chainService.getMaticFeeData();
    fee['nonce'] = nonce;
    await (await bp.mint(userAddress, id, qty, fee)).wait(1);
    await this.inventoryService.increaseBalance(userAddress, creatorId, id, qty);
  }

  async burn(creatorId: number, userAddress: string, id: number, qty: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    await bp.callStatic.burn(userAddress, id, qty).catch((err) => {
      throw new Error('Transaction Reverted!');
    });
    const nonce = await this.chainService.getNonce();
    const fee = await this.chainService.getMaticFeeData();
    fee['nonce'] = nonce;
    await (await bp.burn(userAddress, id, qty, fee)).wait(1);
    await this.inventoryService.decreaseBalance(userAddress, creatorId, id, qty);
  }

  async getStreak(creatorId: number, userAddress: string) {
    const userStreak = await this.microserviceService.getUserStreak(creatorId, userAddress);
    return userStreak.streakDays;
  }

  async giveXp(creatorId: number, userAddress: string, xp: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = (await contract.seasonId()).toNumber();
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    await bp.callStatic.giveXp(seasonId, xp, userAddress).catch((err) => {
      console.log(err);
      throw new Error('Transaction Reverted!');
    });
    const nonce = await this.chainService.getNonce();
    const fee = await this.chainService.getMaticFeeData();
    fee['nonce'] = nonce;

    const followers = await this.microserviceService.getFollowers(creatorId);
    const isFollowing = followers.findIndex((follower) => follower.userAddress === userAddress);
    let oldXpRank, oldRepRank, oldlvl;
    let oldXpRankings: GetRankingDto, oldRepRankings: GetRankingDto;
    if (isFollowing) {
      oldXpRankings = await this.getSeasonRanking(creatorId, seasonId, followers, userAddress);
      oldXpRank = this.getRank(oldXpRankings);
      oldRepRankings = await this.getReputationRanking(creatorId, followers, userAddress);
      oldRepRank = this.getRank(oldRepRankings);
      oldlvl = (await bp.level(userAddress, seasonId)).toNumber();
    }
    await (await bp.giveXp(seasonId, xp, userAddress, fee)).wait(1);
    if (isFollowing) {
      const newlvl = (await bp.level(userAddress, seasonId)).toNumber();
      const newXpRankings: GetRankingDto = await this.getSeasonRanking(
        creatorId,
        seasonId,
        followers,
        userAddress,
      );
      const newXpRank = this.getRank(newXpRankings);
      const newRepRankings: GetRankingDto = await this.getReputationRanking(
        creatorId,
        followers,
        userAddress,
      );
      const newRepRank = this.getRank(newRepRankings);
      if (oldlvl != newlvl) {
        const userInfo = await this.microserviceService.getUserInfo(userAddress);
        const alert: LevelUpAlert = {
          creatorId,
          userAddress,
          oldlvl,
          newlvl,
          name: userInfo.name,
          pfp: userInfo.pfp,
        };
        this.microserviceService.sendLevelUpAlert(alert);
      }
      if (oldXpRank != newXpRank || oldRepRank != newRepRank) {
        const alert: LeaderboardAlert = {
          creatorId,
          userAddress,
          oldXpRank,
          newXpRank,
          oldRepRank,
          newRepRank,
          pfp: oldXpRankings?.pfp,
          name: oldXpRankings?.name,
        };
        this.microserviceService.sendLeaderboardAlert(alert);
      }
    }
  }

  async getStreaks(creatorId: number, userAddress: string) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = (await contract.seasonId()).toNumber();
    const addresses = [];
    const ids = [];
    for (let i = 1; i <= seasonId; i++) {
      addresses.push(userAddress);
      ids.push(i);
    }
    const results = await contract.balanceOfBatch(addresses, ids);
    let counter = 0;
    for (let i = 0; i < results.length; i++) {
      counter = results[i].toNumber() != 0 ? counter++ : 0;
    }
    return counter;
  }
  async claimReward(creatorId: number, userAddress: string, level: number, premium: boolean) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const abi = bp.interface.getFunction('claimReward');
    await this.chainService.simMetatx(abi, [seasonId, level, premium], userAddress, bp.address);
    const nonce = await this.chainService.getNonce();
    const fee = await this.chainService.getMaticFeeData();
    fee['nonce'] = nonce;
    await this.chainService.metatx(abi, [seasonId, level, premium], userAddress, bp.address, fee);
    const rewardGiven = await bp.seasonInfo(seasonId, level);
    let id: number;
    let qty: number;
    if (premium) {
      id = rewardGiven.premiumRewardId.toNumber();
      qty = rewardGiven.premiumRewardQty.toNumber();
    } else {
      id = rewardGiven.freeRewardId.toNumber();
      qty = rewardGiven.freeRewardQty.toNumber();
    }
    const reward = await this.inventoryService.createRewardObj(creatorId, id, qty);
    await this.inventoryService.increaseBalance(userAddress, creatorId, id, qty);
    return { bpAddress: bp.address, reward: [reward] };
  }

  async claimRewardAtomic(creatorId: number, userAddress: string, level: number, premium: boolean) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const abi = bp.interface.getFunction('claimRewardAtomic');
    await this.chainService.simMetatx(abi, [seasonId, level, premium], userAddress, bp.address);

    const nonce = await this.chainService.getNonce();
    const fee = await this.chainService.getMaticFeeData();
    fee['nonce'] = nonce;
    const rc = await this.chainService.metatx(
      abi,
      [seasonId, level, premium],
      userAddress,
      bp.address,
      fee,
    );
    const rewardGiven = await bp.seasonInfo(seasonId, level);
    let id: number;
    let qty: number;
    if (premium) {
      id = rewardGiven.premiumRewardId.toNumber();
      qty = rewardGiven.premiumRewardQty.toNumber();
    } else {
      id = rewardGiven.freeRewardId.toNumber();
      qty = rewardGiven.freeRewardQty.toNumber();
    }
    const metadata = await this.inventoryService.getMetadata(creatorId, id);
    if (metadata.rewardType === RewardType.LOOTBOX) {
      const logs = [];
      for (let i = 0; i < rc.logs.length; i++) {
        try {
          const log = rc.logs[i];
          logs.push(bp.interface.parseLog(log));
        } catch (e) {}
      }
      const log = logs.find((log: any) => log.name === 'LootboxOpened');
      const idxOpened = log.args.idxOpened.toNumber();
      const option = await contract.getLootboxOptionByIdx(id, idxOpened);
      const rewards: Reward[] = [];
      for (let y = 0; y < option[1].length; y++) {
        rewards.push(
          await this.inventoryService.createRewardObj(
            creatorId,
            option[1][y].toNumber(),
            option[2][y].toNumber(),
          ),
        );
      }
      return { bpAddress: bp.address, reward: rewards, metadata };
    } else {
      const reward = await this.inventoryService.createRewardObj(creatorId, id, qty);
      await this.inventoryService.increaseBalance(userAddress, creatorId, id, qty);
      return { bpAddress: bp.address, reward: [reward], metadata };
    }
  }

  async getReputationRankings(creatorId: number, followers: Follower[]) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const addresses = [];
    const ids = [];
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
      addresses.push(follower.userAddress);
      ids.push(this.REPUTATION_ID);
    }
    const results = await contract.balanceOfBatch(addresses, ids);
    const dtos: GetRankingDto[] = [];
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

  async getReputationRanking(creatorId: number, followers: Follower[], _userAddress: string) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const addresses = [];
    const ids = [];
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];
      addresses.push(follower.userAddress);
      ids.push(this.REPUTATION_ID);
    }
    const userAddress = this.chainService.getAddress(_userAddress);
    const results = await contract.balanceOfBatch(addresses, ids);
    const index = followers.findIndex((follower) => follower.userAddress === userAddress);
    const dto: GetRankingDto = {
      id: followers[index].id,
      userAddress: followers[index].userAddress,
      pfp: followers[index]?.pfp,
      name: followers[index]?.name,
      total: 0,
      others: [],
    };
    for (let i = 0; i < results.length; i++) {
      const follower = followers[i];
      dto.others.push({
        total: results[i].toNumber(),
        userAddress: follower.userAddress,
      });
      if (i == index) dto.total = results[i].toNumber();
    }
    dto.others.sort((a, b) => b.total - a.total);
    return dto;
  }

  async getSeasonRankings(creatorId: number, seasonId: number, followers: Follower[]) {
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
    const dtos: GetRankingDto[] = [];
    const others: { total: number; userAddress: string }[] = [];
    for (let i = 0; i < results.length; i++) {
      const follower = followers[i];
      const userInfo = iface.decodeFunctionResult('userInfo', results[i].returnData[1]);
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

  async getSeasonRanking(
    creatorId: number,
    seasonId: number,
    followers: Follower[],
    userAddress: string,
  ) {
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
    const index = followers.findIndex((follower) => follower.userAddress === userAddress);
    const dto: GetRankingDto = {
      id: followers[index].id,
      userAddress: followers[index].userAddress,
      pfp: followers[index]?.pfp,
      name: followers[index]?.name,
      total: 0,
      others: [],
    };
    for (let i = 0; i < results.length; i++) {
      const follower = followers[i];
      const userInfo = iface.decodeFunctionResult('userInfo', results[i].returnData[1]);
      dto.others.push({
        total: userInfo.xp.toNumber(),
        userAddress: follower.userAddress,
      });
      if (i == index) dto.total = userInfo.xp.toNumber();
    }
    dto.others.sort((a, b) => b.total - a.total);
    return dto;
  }

  async getAllSeasonInfo(creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const followers = await this.microserviceService.getFollowers(creatorId);
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
    const dtos: GetRankingDto[] = [];
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
      const userInfo = iface.decodeFunctionResult('userInfo', results[i].returnData[1]);
      xp += userInfo.xp.toNumber();
    }
    return xp;
  }

  getRank(dto: GetRankingDto) {
    return dto.others.findIndex((other) => other.userAddress === dto.userAddress) + 1;
  }

  getTopPercent(dto: GetRankingDto) {
    const index = dto.others.findIndex((other) => other.userAddress === dto.userAddress);
    const topPercent = 100 - ((dto.others.length - index) / dto.others.length) * 100;
    return topPercent > 0.01 ? topPercent : 0.01;
  }

  async getBattlePass(creatorId: number) {
    const bp = await this.battlePassRepository
      .createQueryBuilder('bp')
      .select()
      .where('bp.creator_id = :creatorId', { creatorId })
      .getOne();
    if (bp) return bp;
    throw new Error('BattlePass Not Found!');
  }

  async getBattlePasses() {
    const bp = await this.battlePassRepository.createQueryBuilder().select().getMany();
    if (bp) return bp;
    throw new Error('BattlePasses Not Found!');
  }

  async addBattlePass(creatorId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let bp;
    try {
      bp = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(BattlePassDB)
        .values({
          creator_id: creatorId,
          name: 'TODO',
          description: 'TODO',
          price: 'TODO',
          currency: 'TODO',
          end_date: new Date().toISOString(),
          required_user_payment_options: null,
          required_user_social_options: null,
        })
        .execute();
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      bp = null;
    } finally {
      await queryRunner.release();
    }
    if (bp) return bp;
    throw new Error('Insert BattlePass Failed!');
  }
}
