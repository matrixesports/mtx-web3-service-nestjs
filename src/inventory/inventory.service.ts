import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RewardType } from 'src/graphql.schema';
import { Reward } from 'src/reward/reward.dto';
import { DataSource, InsertResult, Repository } from 'typeorm';
import { InventoryDB, MetadataDB } from './inventory.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
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
    return null;
  }

  async getAsset(userAddress: string, creatorId: number, rewardId: number) {
    const asset = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select()
      .where('inv.userAddress = :userAddress', { userAddress })
      .andWhere('inv.creatorId = :creatorId', { creatorId })
      .andWhere('inv.rewardId = :rewardId', { rewardId })
      .getOne();
    if (asset) return asset;
    return null;
  }

  async increaseBalance(
    userAddress: string,
    creatorId: number,
    rewardId: number,
    qty: number,
  ) {
    const asset = await this.getAsset(userAddress, creatorId, rewardId);
    if (!asset) await this.newAsset(userAddress, creatorId, rewardId, qty);
    else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager
          .createQueryBuilder()
          .update(InventoryDB)
          .set({ qty: (asset as InventoryDB).qty + qty })
          .where('inv.userAddress = :userAddress', { userAddress })
          .andWhere('inv.creatorId = :creatorId', { creatorId })
          .andWhere('inv.rewardId = :rewardId', { rewardId })
          .execute();
        await queryRunner.commitTransaction();
        return true;
      } catch (err) {
        this.logger.error('Inventory Balance Failure!', err);
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
      return false;
    }
  }

  async decreaseBalance(
    userAddress: string,
    creatorId: number,
    rewardId: number,
    qty: number,
  ) {
    const asset = await this.getAsset(userAddress, creatorId, rewardId);
    if (!asset) return false;
    if (asset.qty - qty < 0) return false;
    else if (asset.qty - qty == 0)
      await this.delAsset(userAddress, creatorId, rewardId);
    else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager
          .createQueryBuilder()
          .update(InventoryDB)
          .set({ qty: asset.qty - qty })
          .where('inv.userAddress = :userAddress', { userAddress })
          .andWhere('inv.creatorId = :creatorId', { creatorId })
          .andWhere('inv.rewardId = :rewardId', { rewardId })
          .execute();
        await queryRunner.commitTransaction();
        return true;
      } catch (err) {
        this.logger.error('Inventory Balance Failure!', err);
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
      return false;
    }
  }

  async delAsset(userAddress: string, creatorId: number, rewardId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(InventoryDB)
        .where('inv.userAddress = :userAddress', { userAddress })
        .andWhere('inv.creatorId = :creatorId', { creatorId })
        .andWhere('inv.rewardId = :rewardId', { rewardId })
        .execute();
      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      this.logger.error('Inventory Asset Failure!', err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    return false;
  }

  async newAsset(
    userAddress: string,
    creatorId: number,
    rewardId: number,
    qty: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const asset = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(InventoryDB)
        .values({
          userAddress,
          creatorId,
          rewardId,
          qty,
        })
        .execute();
      await queryRunner.commitTransaction();
      return asset;
    } catch (err) {
      this.logger.error('Inventory Asset Failure!', err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    return null;
  }

  async getMetadata(creatorId: number, metadataId: number) {
    const metadata = await this.metadataRepository
      .createQueryBuilder('metadata')
      .select()
      .where('metadata.id = :metadataId', { metadataId })
      .andWhere('metadata.creatorId = :creatorId', { creatorId })
      .getOne();
    if (metadata) return metadata;
    return null;
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
    let metadata: InsertResult;
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
      this.logger.error('Inventory Asset Failure!', err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    if (metadata) return metadata;
    return null;
  }

  async createRewardObj(creatorId: number, id: number, qty: number) {
    if (id == 0) return null;
    const metadata = await this.getMetadata(creatorId, id);
    if (!metadata) return null;
    return {
      id,
      qty,
      metadata,
      rewardType: metadata.rewardType,
      creatorId,
    } as Reward;
  }
}
