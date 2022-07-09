import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Contract {
  @PrimaryGeneratedColumn()
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
    enum: ['Crafting', 'BattlePass', 'CreatorToken', 'Game'],
  })
  ctr_type: CtrType;
}

export type CtrType = 'Crafting' | 'BattlePass' | 'CreatorToken' | 'Game';
