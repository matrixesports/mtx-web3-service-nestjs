import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Contract } from 'src/contract/contract.entity';
import {
  MissingUserPaymentOptions,
  MissingUserSocialOptions,
} from 'src/graphql.schema';

@Entity()
export class BattlePass {
  @OneToOne(type => Contract)
  @JoinColumn()
  @PrimaryGeneratedColumn()
  address: Contract;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: string;

  @Column()
  currency: string;

  @Column()
  endDate: Date;

  @Column({
    type: 'enum',
    enum: MissingUserSocialOptions,
  })
  missing_user_social_options: [MissingUserSocialOptions];

  @Column({
    type: 'enum',
    enum: MissingUserPaymentOptions,
  })
  missing_user_payment_options: [MissingUserPaymentOptions];
}
