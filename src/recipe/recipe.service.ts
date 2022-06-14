import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Recipe } from './recipe.entity';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepo: Repository<Recipe>,
    private dataSource: DataSource,
  ) {}

  findAllForCreator(creatorId: number): Promise<Recipe[]> {
    return this.recipeRepo.find({ where: { creator_id: creatorId } });
  }

  findOne(creatorId: number, recipeId: number): Promise<Recipe> {
    return this.recipeRepo.findOneByOrFail({
      creator_id: creatorId,
      recipe_id: recipeId,
    });
  }

  async create(recipe: Recipe) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(recipe);
      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  async remove(recipe: Recipe): Promise<void> {
    await this.recipeRepo.delete(recipe);
  }

  async getRecipe(recipe: Recipe) {
    await this.create(recipe);
  }

  //   findAllForCreator(creatorId: number): Promise<Recipe[]> {
  //     return this.dataSource.find({ where: { creator_id: creatorId } });
  //   }

  //   findOne(creatorId: number, recipeId: number): Promise<Recipe> {
  //     return this.dataSource.findOneByOrFail({
  //       creator_id: creatorId,
  //       recipe_id: recipeId,
  //     });
  //   }

  async addRecipe(recipe: Recipe) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(recipe);
      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }
}
