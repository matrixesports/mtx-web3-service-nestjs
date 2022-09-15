import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosResponse } from 'axios';
import { DataSource, Repository } from 'typeorm';
import { RecipeDB } from './crafting.entity';

export type Owner = {
  id: number;
  name: string;
  slug: string;
  pfp: string;
};

@Injectable()
export class CraftingService {
  constructor(
    @InjectRepository(RecipeDB)
    private recipeRepository: Repository<RecipeDB>,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  /*
|========================| SERVICE CALLS |========================|
*/

  async getOwner(creatorIds: number[]) {
    let owners: AxiosResponse<any, any>;
    try {
      owners = await axios.post(
        `${
          this.configService.get('SERVICE').userService
        }/api/creator/getRecipes`,
        { ids: creatorIds },
      );
    } catch (e) {
      throw new Error('Fetch Owners from User-Service Failed!');
    }
    if (owners.data.length == 0)
      throw new Error('Owners Not Found In User-Service!');
    return owners.data as Owner[];
  }

  /*
|========================| REPOSITORY |========================|
*/

  async addRecipe(creatorId: number, recipeId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let recipe;
    try {
      recipe = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(RecipeDB)
        .values({ creator_id: creatorId, id: recipeId })
        .execute();
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      recipe = null;
    } finally {
      await queryRunner.release();
    }
    if (recipe) return recipe;
    throw new Error('Insert Recipe Failed!');
  }

  async getRecipes(creatorId: number) {
    const recipes = await this.recipeRepository
      .createQueryBuilder('recipe')
      .select()
      .where('recipe.creator_id = :creatorId', { creatorId })
      .getMany();
    if (recipes.length != 0) return recipes;
    throw new Error('Recipes Not Found!');
  }

  async getRecipe(creatorId: number, recipeId: number) {
    const recipe = await this.recipeRepository
      .createQueryBuilder('recipe')
      .select('recipe.id')
      .where('recipe.id = :recipeId', { recipeId })
      .andWhere('recipe.creator_id = :creatorId', { creatorId })
      .getOne();
    if (recipe) return recipe;
    throw new Error('Recipe Not Found!');
  }

  async checkRecipe(recipeId: number) {
    if (
      await this.recipeRepository
        .createQueryBuilder('recipe')
        .select('recipe.id')
        .where('recipe.id = :recipeId', { recipeId })
        .getOne()
    )
      return true;
    throw new Error('Recipe Not Found!');
  }

  async getAllRecipes() {
    const recipes = await this.recipeRepository
      .createQueryBuilder('recipe')
      .getMany();
    if (recipes.length != 0) return recipes;
    throw new Error('Recipes Not Found!');
  }
}
