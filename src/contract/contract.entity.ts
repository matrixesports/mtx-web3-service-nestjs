import { Entity, Column, PrimaryColumn } from 'typeorm';

export type CtrType =
  | 'Workshop'
  | 'Distributor'
  | 'Pass'
  | 'Lootbox'
  | 'Redeemable'
  | 'ERC20'
  | 'ERC721'
  | 'ERC1155';

@Entity()
export class Contract {
  @PrimaryColumn()
  address: string;

  @Column()
  name: string;

  @Column()
  network: string;

  @Column()
  creator_id: number;

  @Column({
    type: 'enum',
    enum: [
      'Workshop',
      'Distributor',
      'Pass',
      'Lootbox',
      'Redeemable',
      'ERC20',
      'ERC721',
      'ERC1155',
    ],
  })
  ctr_type: CtrType;

  @Column('simple-json')
  abi: any;
}
