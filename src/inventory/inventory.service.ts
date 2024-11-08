import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RewardType } from 'src/graphql.schema';
import { Reward } from 'src/reward/reward.dto';
import { DataSource, DeleteResult, InsertResult, Repository, UpdateResult } from 'typeorm';
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

  async getAsset(userAddress: string, creatorId: number, rewardId: number) {
    const asset = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select()
      .where('inv.userAddress = :userAddress', { userAddress })
      .andWhere('inv.creatorId = :creatorId', { creatorId })
      .andWhere('inv.rewardId = :rewardId', { rewardId })
      .getOne();
    if (asset) return asset;
    throw new Error('Asset Not Found!');
  }

  async getAssetNullable(userAddress: string, creatorId: number, rewardId: number) {
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

  async increaseBalance(userAddress: string, creatorId: number, rewardId: number, qty: number) {
    const asset = await this.getAssetNullable(userAddress, creatorId, rewardId);
    if (!asset) await this.newAsset(userAddress, creatorId, rewardId, qty);
    else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let res: UpdateResult;
      try {
        res = await queryRunner.manager
          .createQueryBuilder()
          .update(InventoryDB)
          .set({ qty: (asset as InventoryDB).qty + qty })
          .where('userAddress = :userAddress', { userAddress })
          .andWhere('creatorId = :creatorId', { creatorId })
          .andWhere('rewardId = :rewardId', { rewardId })
          .execute();
        await queryRunner.commitTransaction();
      } catch (err) {
        console.log({ err });
        await queryRunner.rollbackTransaction();
        res = null;
      } finally {
        await queryRunner.release();
      }
      if (res) return;
      throw new Error('Increase Balance For Asset Failed!');
    }
  }

  async decreaseBalance(userAddress: string, creatorId: number, rewardId: number, qty: number) {
    const asset = await this.getAsset(userAddress, creatorId, rewardId);
    if (asset.qty - qty == 0) await this.delAsset(userAddress, creatorId, rewardId);
    else if (asset.qty - qty <= 0) throw new Error('Inventory Failure!');
    else {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let res: UpdateResult;
      try {
        res = await queryRunner.manager
          .createQueryBuilder()
          .update(InventoryDB)
          .set({ qty: asset.qty - qty })
          .where('userAddress = :userAddress', { userAddress })
          .andWhere('creatorId = :creatorId', { creatorId })
          .andWhere('rewardId = :rewardId', { rewardId })
          .execute();
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        res = null;
      } finally {
        await queryRunner.release();
      }
      if (res) return;
      throw new Error('Decrease Balance For Asset Failed!');
    }
  }

  async delAsset(userAddress: string, creatorId: number, rewardId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let res: DeleteResult;
    try {
      res = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(InventoryDB)
        .where('userAddress = :userAddress', { userAddress })
        .andWhere('creatorId = :creatorId', { creatorId })
        .andWhere('rewardId = :rewardId', { rewardId })
        .execute();
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
      res = null;
    } finally {
      await queryRunner.release();
    }
    if (res) return;
    throw new Error('Remove Asset Failed!');
  }

  async newAsset(userAddress: string, creatorId: number, rewardId: number, qty: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let res: DeleteResult;
    try {
      res = await queryRunner.manager
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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      res = null;
    } finally {
      await queryRunner.release();
    }
    if (res) return;
    throw new Error('Remove Asset Failed!');
  }

  async getMetadata(creatorId: number, metadataId: number) {
    const metadata = await this.metadataRepository
      .createQueryBuilder('md')
      .select()
      .where('md.id = :metadataId', { metadataId })
      .andWhere('md.creatorId = :creatorId', { creatorId })
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
