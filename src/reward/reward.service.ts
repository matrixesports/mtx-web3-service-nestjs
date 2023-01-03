import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { plainToInstance } from 'class-transformer';
import { LootdropRS } from './reward.dto';
import { Injectable } from '@nestjs/common';
import { ChainService } from 'src/chain/chain.service';
import { MicroserviceService } from 'src/microservice/microservice.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { Requirements } from 'src/graphql.schema';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ClaimLootdropAlert } from 'src/microservice/microservice.dto';

@Injectable()
export class RewardService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private chainService: ChainService,
    private microserviceService: MicroserviceService,
    private inventoryService: InventoryService,
    private battlePassService: BattlePassService,
  ) {}

  async claimLootdrop(creatorId: number, userAddress: string, contact: string, lootdropId: number) {
    const lootdrops = await this.getlootdrops(creatorId);
    let userThreshold: number;
    switch (lootdrops[lootdropId].requirements) {
      case Requirements.ALLXP:
        // better leaderboard fn
        userThreshold = await this.battlePassService.getOneAllSeasonInfo(creatorId, userAddress);
        if (userThreshold == null) throw new Error('On-Chain Error!');
        if (userThreshold < lootdrops[lootdropId].threshold)
          throw new Error(
            `You need ${
              lootdrops[lootdropId].threshold - userThreshold
            } more XP to claim this Lootdrop!`,
          );
        break;
      case Requirements.REPUTATION:
        userThreshold = await this.battlePassService.getBalance(
          creatorId,
          userAddress,
          lootdrops[lootdropId].rewardId,
        );
        if (userThreshold < lootdrops[lootdropId].threshold)
          throw new Error(
            `You need ${
              lootdrops[lootdropId].threshold - userThreshold
            } more Reputation to claim this Lootdrop!`,
          );
        break;
      case Requirements.SEASONXP:
        userThreshold = await this.battlePassService.getXp(creatorId, userAddress);
        if (userThreshold < lootdrops[lootdropId].threshold)
          throw new Error(
            `You need ${
              lootdrops[lootdropId].threshold - userThreshold
            } more XP to claim this Lootdrop!`,
          );
        break;
      case Requirements.STREAK:
        userThreshold = await this.battlePassService.getStreak(creatorId, userAddress);
        if (userThreshold < lootdrops[lootdropId].threshold)
          throw new Error(
            `You need ${
              lootdrops[lootdropId].threshold - userThreshold
            } more Streak days to claim this Lootdrop!`,
          );
        break;
      default:
        throw new Error('Invalid Lootdrop!');
    }
    if (userThreshold < lootdrops[lootdropId].threshold)
      throw new Error('User Cannot Meet Requirements!');
    await this.setLootdropQty(creatorId, userAddress, lootdropId);
    const bpAddress = await this.chainService.getBattlePassAddress(creatorId);
    const metadata = await this.inventoryService.getMetadata(
      creatorId,
      lootdrops[lootdropId].rewardId,
    );
    await this.microserviceService.sendRedeemAlert(
      lootdrops[lootdropId].rewardId,
      userAddress,
      creatorId,
      bpAddress,
      metadata,
      contact,
    );
    const userInfo = await this.microserviceService.getUserInfo(userAddress);
    const alert: ClaimLootdropAlert = {
      creatorId,
      userAddress,
      name: userInfo.name,
      pfp: userInfo.pfp,
      lootdropId: lootdrops[lootdropId].rewardId,
      start: lootdrops[lootdropId].start,
      end: lootdrops[lootdropId].end,
      url: lootdrops[lootdropId].url,
    };
    this.microserviceService.sendClaimLootdropAlert(alert);
    return { success: true };
  }
  async getlootdrop(creatorId: number): Promise<LootdropRS> {
    const target = `lootdrop-${creatorId}`;
    const cache = await this.redis.get(target);
    if (cache == null) throw new Error('Lootdrop Not Active!');
    return plainToInstance(LootdropRS, JSON.parse(cache as string));
  }

  async getlootdrops(creatorId: number): Promise<Array<LootdropRS>> {
    const target = `lootdrop-${creatorId}`;
    const cache = await this.redis.get(target);
    if (cache == null) return [];
    return plainToInstance(LootdropRS, <LootdropRS[]>JSON.parse(cache as string));
  }

  async setLootdropQty(creatorId: number, userAddress: string, lootdropId: number) {
    const target = `lootdrop-${creatorId}`;
    const claimed = await this.redis.sismember(
      target + '-' + lootdropId.toString() + '-list',
      userAddress,
    );
    if (claimed != null && claimed == 1) throw new Error('Already Claimed!');
    const lootdrops = await this.getlootdrops(creatorId);
    if (lootdrops[lootdropId].qty == -1) {
      await this.redis.sadd(target + '-' + lootdropId.toString() + '-list', userAddress);
      return;
    } else {
      let retry = true;
      while (retry) {
        retry = false;
        await this.redis.watch(target);
        const cache = await this.redis.get(target + '-' + lootdropId.toString() + '-qty');
        if (cache == null) throw new Error('Lootdrop Not Active!');
        const qty = parseInt(cache);
        if (qty == 0) throw new Error('Out of Rewards!');
        await this.redis
          .multi()
          .set(target + '-' + lootdropId.toString() + '-qty', qty - 1, 'KEEPTTL')
          .sadd(target + '-' + lootdropId.toString() + '-list', userAddress)
          .exec()
          .catch(() => {
            retry = true;
          });
      }
    }
  }
}
