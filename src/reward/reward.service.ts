import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { Warn } from 'src/common/error.interceptor';
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

  async claimLootdrop(creatorId: number, userAddress: string, contact: string) {
    const lootdrop = await this.getlootdrop(creatorId);
    // TODO UPDATE WITH CONTACTT UNFO
    let userThreshold: number;
    switch (lootdrop.requirements) {
      case Requirements.ALLXP:
        userThreshold = await this.battlePassService.getOneAllSeasonInfo(creatorId, userAddress);
        if (userThreshold == null) throw new Error('On-Chain Error!');
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${lootdrop.threshold - userThreshold} more XP to claim this Lootdrop!`,
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
        userThreshold = await this.battlePassService.getXp(creatorId, userAddress);
        if (userThreshold < lootdrop.threshold)
          throw new Warn(
            `You need ${lootdrop.threshold - userThreshold} more XP to claim this Lootdrop!`,
          );
        break;
      default:
        throw new Error('Invalid Lootdrop!');
    }
    if (userThreshold < lootdrop.threshold) throw new Warn('User Cannot Meet Requirements!');
    await this.setLootdropQty(creatorId, userAddress);
    const bpAddress = await this.chainService.getBattlePassAddress(creatorId);
    const metadata = await this.inventoryService.getMetadata(creatorId, lootdrop.rewardId);
    await this.microserviceService.sendRedeemAlert(
      lootdrop.rewardId,
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
    };
    this.microserviceService.sendClaimLootdropAlert(alert);
    return { success: true };
  }
  async getlootdrop(creatorId: number): Promise<LootdropRS> {
    const target = `lootdrop-${creatorId}`;
    const cache = await this.redis.get(target);
    if (cache == null) throw new Warn('Lootdrop Not Active!');
    return plainToInstance(LootdropRS, JSON.parse(cache as string));
  }

  async setLootdropQty(creatorId: number, userAddress: string) {
    const target = `lootdrop-${creatorId}`;
    const claimed = await this.redis.sismember(target + '-list', userAddress);
    if (claimed != null && claimed == 1) throw new Warn('Already Claimed!');
    const lootdrop = await this.getlootdrop(creatorId);
    if (lootdrop.qty == -1) {
      await this.redis.sadd(target + '-list', userAddress);
      return;
    } else {
      let retry = true;
      while (retry) {
        retry = false;
        await this.redis.watch(target);
        const cache = await this.redis.get(target + '-qty');
        if (cache == null) throw new Warn('Lootdrop Not Active!');
        const qty = parseInt(cache);
        if (qty == 0) throw new Warn('Out of Rewards!');
        await this.redis
          .multi()
          .set(target + '-qty', qty - 1, 'KEEPTTL')
          .sadd(target + '-list', userAddress)
          .exec()
          .catch(() => {
            retry = true;
          });
      }
    }
  }
}
