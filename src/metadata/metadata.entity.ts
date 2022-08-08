import { RewardType } from 'src/graphql.schema';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('metadata')
export class MetadataDB {
  @PrimaryColumn()
  creator_id: number;

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
  })
  reward_type: RewardType;
}
