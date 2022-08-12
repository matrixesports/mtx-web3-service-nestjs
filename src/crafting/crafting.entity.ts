import { Entity, PrimaryColumn } from 'typeorm';

@Entity('recipe')
export class RecipeDB {
  @PrimaryColumn()
  creator_id: number;

  @PrimaryColumn()
  id: number;
}
