import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('recipe')
export class RecipeDB {
  @PrimaryColumn()
  id: number;

  @Column()
  @Index('ix_creator')
  creator_id: number;
}
