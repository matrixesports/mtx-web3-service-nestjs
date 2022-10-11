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

export class RecipeRS {
  creatorId: number;
  recipeId: number;
  recipe: Recipe;
  active: boolean;
  owner?: {
    name: string;
    slug: string;
    pfp: string;
  };
}
