import { RewardType } from 'src/graphql.schema';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('inventory')
export class InventoryDB extends BaseEntity {
  @PrimaryColumn({ name: 'user_address' })
  userAddress: string;

  @PrimaryColumn({ name: 'creator_id' })
  creatorId: number;

  @PrimaryColumn({ name: 'asset' })
  rewardId: number;

  @Column({ name: 'balance' })
  qty: number;
}

@Entity('metadata')
export class MetadataDB extends BaseEntity {
  @PrimaryColumn({ name: 'creator_id' })
  creatorId: number;

  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  image: string;

  @Column({
    type: 'enum',
    enum: RewardType,
    name: 'reward_type',
  })
  rewardType: RewardType;
}
