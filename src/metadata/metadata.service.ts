import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataDB } from './metadata.entity';
import { RewardType } from 'src/graphql.schema';

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
    }
  }
}
