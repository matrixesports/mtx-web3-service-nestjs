import {
  RequiredUserPaymentOptions,
  RequiredUserSocialOptions,
} from 'src/graphql.schema';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class BattlePass {
  @PrimaryColumn()
  address: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: string;

  @Column()
  currency: string;

  @Column()
  end_date: Date;

  @Column({
    type: 'enum',
    enum: Object.values(RequiredUserSocialOptions),
  })
  required_user_social_options: RequiredUserSocialOptions[];

  @Column({
    type: 'enum',
    enum: Object.values(RequiredUserPaymentOptions),
  })
  required_user_payment_options: RequiredUserPaymentOptions[];
}
