import {
  RequiredUserPaymentOptions,
  RequiredUserSocialOptions,
} from 'src/graphql.schema';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('battlepass')
export class BattlePassDB {
  @PrimaryColumn()
  creator_id: number;

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

  //enum array returns {first,second} as string
  @Column({
    type: 'enum',
    enum: Object.values(RequiredUserSocialOptions),
  })
  required_user_social_options: string;

  @Column({
    type: 'enum',
    enum: Object.values(RequiredUserPaymentOptions),
  })
  required_user_payment_options: string;
}
