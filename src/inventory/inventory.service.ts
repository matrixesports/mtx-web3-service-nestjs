import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RewardType } from 'src/graphql.schema';
import { Reward } from 'src/reward/reward.dto';
import { DataSource, Repository } from 'typeorm';
import { InventoryDB, MetadataDB } from './inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryDB)
    private inventoryRepository: Repository<InventoryDB>,
    @InjectRepository(MetadataDB)
    private metadataRepository: Repository<MetadataDB>,
    private dataSource: DataSource,
  ) {}

  async getInventory(userAddress: string) {
    const inv = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select()
      .where('inv.userAddress = :userAddress', { userAddress })
      .getMany();
    if (inv) return inv;
    throw new Error('UserAddress Not Found!');
  }

  async getMetadata(creatorId: number, metadataId: number) {
    const metadata = await this.metadataRepository
      .createQueryBuilder('metadata')
      .select()
      .where('metadata.id = :metadataId', { metadataId })
      .andWhere('metadata.creatorId = :creatorId', { creatorId })
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
          creatorId,
          id,
          name,
          description,
          image,
          rewardType,
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
      rewardType: metadata.rewardType,
      creatorId,
    } as Reward;
  }
}
