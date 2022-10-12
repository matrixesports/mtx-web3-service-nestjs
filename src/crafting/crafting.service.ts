import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Crafting__factory } from 'abi/typechain';
import axios, { AxiosResponse } from 'axios';
import { Result } from 'ethers/lib/utils';
import { ContractCall } from 'pilum';
import { ChainService } from 'src/chain/chain.service';
import { DataSource, Repository } from 'typeorm';
import { Ingridients, Recipe, RecipeDB } from './crafting.entity';
import { plainToInstance } from 'class-transformer';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

export type Owner = {
  id: number;
  name: string;
  slug: string;
  pfp: string;
};

@Injectable()
export class CraftingService {
  private readonly logger = new Logger(CraftingService.name);
  constructor(
    @InjectRepository(RecipeDB)
    private recipeRepository: Repository<RecipeDB>,
    @InjectRedis() private readonly redis: Redis,
    private configService: ConfigService,
    private dataSource: DataSource,
    private chainService: ChainService,
  ) {}

  /*
|========================| WEB3 CALLS |========================|
*/
  async getIngridients(recipesDB: RecipeDB[]) {
    const recipes: Recipe[] = [];
    const notCached: RecipeDB[] = [];
    for (let i = 0; i < recipesDB.length; i++) {
      const target = `recipe-${recipesDB[i].id}`;
      const cache = await this.redis.get(target).catch((error) => {
        this.logger.error({
          operation: 'Cache Read',
          error,
        });
        notCached.push(recipesDB[i]);
      });
      if (cache == null) notCached.push(recipesDB[i]);
      else recipes.push(plainToInstance(Recipe, JSON.parse(cache as string)));
    }
    if (notCached.length > 0) {
      const calls: ContractCall[] = [];
      const iface = Crafting__factory.createInterface();
      const infragment = iface.getFunction('getInputIngredients');
      const outfragment = iface.getFunction('getOutputIngredients');
      for (let i = 0; i < notCached.length; i++) {
        calls.push({
          reference: 'getInputIngredients',
          address: this.chainService.craftingProxy.address,
          abi: [infragment],
          method: 'getInputIngredients',
          params: [notCached[i].id],
          value: 0,
        });
        calls.push({
          reference: 'getOutputIngredients',
          address: this.chainService.craftingProxy.address,
          abi: [outfragment],
          method: 'getOutputIngredients',
          params: [notCached[i].id],
          value: 0,
        });
      }
      const results = await this.chainService.multicall(calls);
      for (let i = 0; i < results.length - 1; i += 2) {
        const recipe: Recipe = {
          input: this.mapIngridients(
            iface.decodeFunctionResult(
              'getInputIngredients',
              results[i].returnData[1],
            ),
          ),
          output: this.mapIngridients(
            iface.decodeFunctionResult(
              'getOutputIngredients',
              results[i + 1].returnData[1],
            ),
          ),
        };
        const target = `recipe-${notCached[i].id}`;
        await this.redis.set(target, JSON.stringify(recipe)).catch((error) => {
          this.logger.error({
            operation: 'Cache Write',
            error,
          });
        });
        recipes.push(recipe);
      }
    }
    return recipes;
  }

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
        .values({ creator_id: creatorId, id: recipeId, active: true })
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

  async getActiveRecipes(creatorId: number) {
    const recipes = await this.recipeRepository
      .createQueryBuilder('recipe')
      .select('recipe')
      .where('recipe.creator_id = :creatorId', { creatorId })
      .andWhere('recipe.active = :active', { active: true })
      .getMany();
    if (recipes.length != 0) return recipes;
    throw new Error('Recipes Not Found!');
  }

  async getRecipes(creatorId: number) {
    const recipes = await this.recipeRepository
      .createQueryBuilder('recipe')
      .select('recipe')
      .where('recipe.creator_id = :creatorId', { creatorId })
      .getMany();
    if (recipes.length != 0) return recipes;
    throw new Error('Recipes Not Found!');
  }

  async getActiveRecipe(creatorId: number, recipeId: number) {
    const recipe = await this.recipeRepository
      .createQueryBuilder('recipe')
      .select('recipe')
      .where('recipe.id = :recipeId', { recipeId })
      .andWhere('recipe.creator_id = :creatorId', { creatorId })
      .andWhere('recipe.active = :active', { active: true })
      .getOne();
    if (recipe) return recipe;
    throw new Error('Recipe Not Found or Inactive!');
  }

  async getRecipe(creatorId: number, recipeId: number) {
    const recipe = await this.recipeRepository
      .createQueryBuilder('recipe')
      .select('recipe')
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

  async getAllActiveRecipes() {
    const recipes = await this.recipeRepository
      .createQueryBuilder('recipe')
      .where('recipe.active = :active', { active: true })
      .getMany();
    if (recipes.length != 0) return recipes;
    throw new Error('Recipes Not Found!');
  }

  async getAllRecipes() {
    const recipes = await this.recipeRepository
      .createQueryBuilder('recipe')
      .getMany();
    if (recipes.length != 0) return recipes;
    throw new Error('Recipes Not Found!');
  }

  /*
|========================| HELPERS |========================|
*/
  mapIngridients(_ingredients: Result) {
    const ingridients: Ingridients = {
      battlePasses: [],
      ids: [],
      qtys: [],
    };
    for (let i = 0; i < _ingredients[0][0].length; i++) {
      ingridients.battlePasses.push(_ingredients[0][0][i]);
      ingridients.ids.push(_ingredients[0][1][i].toNumber());
      ingridients.qtys.push(_ingredients[0][2][i].toNumber());
    }
    return ingridients;
  }
}
