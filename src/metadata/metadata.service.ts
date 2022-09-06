import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataDB } from './metadata.entity';
import { Reward, RewardType } from 'src/graphql.schema';
import { BigNumber } from 'ethers';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(MetadataDB)
    private metadataRepository: Repository<MetadataDB>,
  ) {}

  async getMetadata(creatorId: number, id: number): Promise<MetadataDB> {
    return await this.metadataRepository.findOneByOrFail({
      creator_id: creatorId,
      id,
    });
  }

  async addMetadata(
    creatorId: number,
    id: number,
    name: string,
    description: string,
    image: string,
    rewardType: RewardType,
  ) {
    const entity: MetadataDB = {
      creator_id: creatorId,
      id,
      name,
      description,
      image,
      reward_type: rewardType,
    };
    try {
      return await this.metadataRepository.insert([entity]);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async createRewardObj(
    creatorId: number,
    id: BigNumber,
    qty: BigNumber,
  ): Promise<Reward> {
    if (!id || id.isZero()) return null;
    const metadata = await this.getMetadata(creatorId, id.toNumber());
    return {
      id,
      qty,
      metadata,
      rewardType: metadata.reward_type,
      creatorId,
    };
  }
}
