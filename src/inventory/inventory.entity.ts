import { RewardType } from 'src/graphql.schema';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('inventory')
export class InventoryDB {
  @PrimaryColumn({ name: 'user_address' })
  userAddress: string;

  @PrimaryColumn({ name: 'creator_id' })
  creatorId: number;

  @PrimaryColumn()
  asset: number;

  @Column()
  balance: number;
}

@Entity('metadata')
export class MetadataDB {
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
