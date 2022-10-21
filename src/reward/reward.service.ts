import { Logger } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { Warn } from 'src/common/error.interceptor';
import { plainToInstance } from 'class-transformer';
import { LootdropInfo, LootdropRS } from './reward.entity';

export class RewardService {
  private readonly logger = new Logger(RewardService.name);
  constructor(@InjectRedis() private readonly redis: Redis) {}

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
    await this.redis.watch(target);
    const cache = await this.redis.get(target + '-qty');
    if (cache == null) throw new Warn('Lootdrop Not Active!');
    const qty = parseInt(cache);
    if (qty == -1) {
      await this.redis.sadd(target + '-list', userAddress);
      return;
    } else if (qty == 0) throw new Warn('Out of Rewards!');
    else {
      await this.redis
        .multi()
        .set(target + '-qty', qty - 1, 'KEEPTTL')
        .exec()
        .catch(() => {
          throw new Warn('Someone claimed before you, please try again!');
        });
      await this.redis.sadd(target + '-list', userAddress);
    }
  }

  async getActiveLootdrop(creatorId: number) {
    const data = await this.redis.get(`${creatorId}-lootdrop`);
    return JSON.parse(data) as LootdropInfo;
  }
}
