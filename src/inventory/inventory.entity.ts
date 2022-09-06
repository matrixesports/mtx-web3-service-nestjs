import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('inventory')
export class InventoryDB {
  @PrimaryColumn()
  @Check("user_address ~* '^^0x[a-fA-F0-9]{40}$'")
  user_address: string;

  @PrimaryColumn()
  @Check("contract_address ~* '^^0x[a-fA-F0-9]{40}$'")
  contract_address: string;

  @PrimaryColumn()
  id: number;

  @Column()
  balance: number;
}
