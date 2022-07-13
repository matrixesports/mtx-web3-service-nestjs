import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum ctrtype {
  CRAFTING = 'Crafting',
  BATTLE_PASS = 'BattlePass',
  CREATOR_TOKEN = 'CreatorToken',
  GAME = 'Game',
}

@Entity()
export class Contract {
  @PrimaryColumn()
  address: string;

  @Column()
  network: string;

  @Column()
  name: string;

  @Column('simple-json')
  abi: any;

  @Column()
  creator_id: number;

  @Column({
    type: 'enum',
    enum: ctrtype,
  })
  ctr_type: ctrtype;
}
