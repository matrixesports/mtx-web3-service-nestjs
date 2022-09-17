import { Result } from 'ethers/lib/utils';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('recipe')
export class RecipeDB {
  @PrimaryColumn()
  id: number;

  @Column()
  @Index('ix_creator')
  creator_id: number;

  @Column()
  active: boolean;
}

export type Ingridients = {
  battlePasses: string[];
  ids: number[];
  qtys: number[];
};

export type Recipe = {
  input: Ingridients;
  output: Ingridients;
};
