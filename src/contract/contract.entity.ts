import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum CtrType {
  CRAFTING = 'CRAFTING',
  BATTLE_PASS = 'BATTLE_PASS',
  CREATOR_TOKEN = 'CREATOR_TOKEN',
  GAME = 'GAME',
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
    enum: CtrType,
  })
  ctr_type: CtrType;
}
