import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { plainToInstance } from 'class-transformer';
import { LootdropRS, NewLootdrops } from './reward.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChainService } from 'src/chain/chain.service';
import { MicroserviceService } from 'src/microservice/microservice.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { Requirements } from 'src/graphql.schema';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ClaimLootdropAlert } from 'src/microservice/microservice.dto';
import { MINECRAFT_TOKENS } from 'src/battlepass/battlepass.dto';
import { ManacubeService } from 'src/manacube/manacube.service';

@Injectable()
export class RewardService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private chainService: ChainService,
    private microserviceService: MicroserviceService,
    private inventoryService: InventoryService,
    private battlePassService: BattlePassService,
    private manaService: ManacubeService,
  ) {}

  async claimLootdrop(creatorId: number, userAddress: string, contact: string, lootdropId: string) {
    console.log('Claiming a particular lootdrop');
    const lootdrop = await this.getlootdrop(creatorId, lootdropId);
    // maybe null check at this point
    let userThreshold: number;
    switch (lootdrop.requirements) {
      case Requirements.ALLXP:
        // better leaderboard fn
        userThreshold = await this.battlePassService.getOneAllSeasonInfo(creatorId, userAddress);
        if (userThreshold == null) throw new Error('On-Chain Error!');
        if (userThreshold < lootdrop.threshold)
          throw new Error(
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
          throw new Error(
            `You need ${
              lootdrop.threshold - userThreshold
            } more Reputation to claim this Lootdrop!`,
          );
        break;
      case Requirements.SEASONXP:
        userThreshold = await this.battlePassService.getXp(creatorId, userAddress);
        if (userThreshold < lootdrop.threshold)
          throw new Error(
            `You need ${lootdrop.threshold - userThreshold} more XP to claim this Lootdrop!`,
          );
        break;
      case Requirements.STREAK:
        console.log('Claim Lootdrop STREAK');
        userThreshold = await this.battlePassService.getStreak(creatorId, userAddress);
        if (userThreshold < lootdrop.threshold)
          throw new Error(
            `You need ${
              lootdrop.threshold - userThreshold
            } more Streak days to claim this Lootdrop!`,
          );
        break;
      default:
        throw new Error('Invalid Lootdrop!');
    }
    if (userThreshold < lootdrop.threshold) throw new Error('User Cannot Meet Requirements!');
    await this.setLootdropQty(creatorId, userAddress, lootdropId);
    // store the claimed lootdrop
    console.log('Claimed');
    const reward = await this.inventoryService.createRewardObj(creatorId, lootdrop.rewardId, 1);
    // once claimed, reward the user for minecraft rewards
    // keywords check
    const keywords = [];
    MINECRAFT_TOKENS.forEach((word) => {
      if (reward.metadata.name.toLowerCase().includes(word)) keywords.push(word);
    });
    if (keywords.length > 0) {
      // get the minecraft player from the db
      const player = await this.microserviceService.getUserDetails(userAddress);
      // check if player has minecraft linked
      if (!player.minecraft) {
        console.log('=> The player has not linked their minecraft account', userAddress);
        return;
      }
      const playerId = player.minecraft.uuid;
      // check for the specific title of the reward
      if (reward.metadata.name.toLowerCase().includes('level')) {
        // this can be termed as a reward which includes incrementing the level
        await this.manaService.incrementPlayerLevel(playerId, 'manaapi:matrix', lootdrop.qty);
      } else if (reward.metadata.name.toLowerCase().includes('cubit')) {
        await this.manaService.incrementPlayerCubits(playerId, lootdrop.qty);
      }
    }
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
      lootdropId: lootdrop.lootdropId,
      start: lootdrop.start,
      end: lootdrop.end,
      url: lootdrop.url,
    };
    this.microserviceService.sendClaimLootdropAlert(alert);
    return { success: true };
  }

  async getlootdrop(creatorId: number, lootdropId?: string): Promise<LootdropRS> {
    const target = `lootdrop-${creatorId}`;
    const cache = await this.redis.get(target);
    if (cache == null)
      throw new Error(`Could not get any active lootdrop for creator ${creatorId}!`);
    const lootdropsCache = plainToInstance(LootdropRS, <LootdropRS[]>JSON.parse(cache as string));
    const lootdrop = lootdropsCache.find((lootdrop) => lootdrop.lootdropId === lootdropId);
    if (!lootdrop)
      throw new Error(`Could not get lootdrop for creator ${creatorId} with id ${lootdropId}`);
    return lootdrop;
  }

  async getlootdrops(creatorId: number): Promise<LootdropRS[]> {
    const target = `lootdrop-${creatorId}`;
    const cache = await this.redis.get(target);
    if (cache == null) return [];
    return plainToInstance(LootdropRS, <LootdropRS[]>JSON.parse(cache as string));
  }

  async setLootdropQty(creatorId: number, userAddress: string, lootdropId: string) {
    const target = `lootdrop-${creatorId}`;
    const claimed = await this.redis.sismember(target + '-' + lootdropId + '-list', userAddress);
    if (claimed != null && claimed == 1) throw new Error('Already Claimed!');
    const lootdrop = await this.getlootdrop(creatorId, lootdropId);
    if (lootdrop.qty == -1) {
      await this.redis.sadd(target + '-' + lootdropId + '-list', userAddress, 'KEEPTTL');
      return;
    } else {
      let retry = true;
      while (retry) {
        retry = false;
        await this.redis.watch(target);
        const cache = await this.redis.get(target + '-' + lootdropId + '-qty');
        if (cache == null) throw new Error('Lootdrop Not Active!');
        const qty = parseInt(cache);
        if (qty == 0) throw new Error('Out of Rewards!');
        await this.redis
          .multi()
          .set(target + '-' + lootdropId + '-qty', qty - 1, 'KEEPTTL')
          .sadd(target + '-' + lootdropId + '-list', userAddress, 'KEEPTTL')
          .exec()
          .catch(() => {
            retry = true;
          });
      }
    }
  }

  // use this to get a users claimed lootdrops
  async getClaimedLootdrops(creatorId: number, userAddress: string) {
    // get a list of all lootdrops claimed by a user.
    const target = `lootdrop-${creatorId}`;
    // all lootdrops
    const cache = await this.redis.get(target);
    const lootdrops = plainToInstance(LootdropRS, <LootdropRS[]>JSON.parse(cache as string));
    if (!lootdrops || lootdrops.length < 1) return [];
    const claimedByUser: LootdropRS[] = [];
    for (let i = 0; i < lootdrops.length; i++) {
      // check if the user address exists on the given key
      // the key holds the addresses of the users who have claimed the lootdrop
      const claimed = await this.redis.sismember(
        target + '-' + lootdrops[i].lootdropId + '-list',
        userAddress,
      );
      // add the lootdrop to the claimed lootdrops list
      if (claimed != null && claimed == 1) {
        claimedByUser.push(lootdrops[i]);
      }
    }
    return claimedByUser;
  }
}
