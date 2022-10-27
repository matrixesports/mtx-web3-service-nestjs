import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MetadataDB } from './metadata.entity';
import { Reward, RewardType } from 'src/graphql.schema';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(MetadataDB)
    private metadataRepository: Repository<MetadataDB>,
    private dataSource: DataSource,
  ) {}

  /*
|========================| REPOSITORY |========================|
*/

  async getMetadata(creatorId: number, metadataId: number) {
    const metadata = await this.metadataRepository
      .createQueryBuilder('metadata')
      .select()
      .where('metadata.id = :metadataId', { metadataId })
      .andWhere('metadata.creator_id = :creatorId', { creatorId })
      .getOne();
    if (metadata) return metadata;
    throw new Error('Metadata Not Found!');
  }

  async addMetadata(
    creatorId: number,
    id: number,
    name: string,
    description: string,
    image: string,
    rewardType: RewardType,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let metadata;
    try {
      metadata = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(MetadataDB)
        .values({
          creator_id: creatorId,
          id,
          name,
          description,
          image,
          reward_type: rewardType,
        })
        .execute();
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      metadata = null;
    } finally {
      await queryRunner.release();
    }
    if (metadata) return metadata;
    throw new Error('Insert Metadata Failed!');
  }

  async createRewardObj(creatorId: number, id: number, qty: number) {
    if (id == 0) return null;
    const metadata = await this.getMetadata(creatorId, id);
    return {
      id,
      qty,
      metadata,
      rewardType: metadata.reward_type,
      creatorId,
    } as Reward;
  }
}
