import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosResponse } from 'axios';
import { Repository } from 'typeorm';
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
    return await this.recipeRepository
      .createQueryBuilder('recipe')
      .insert()
      .values({ creator_id: creatorId, id: recipeId })
      .execute();
  }

  async getRecipes(creatorId: number) {
    return await this.recipeRepository
      .createQueryBuilder('recipe')
      .select()
      .where('recipe.creator_id = :creatorId', { creatorId })
      .getMany();
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
    return await this.recipeRepository.createQueryBuilder('recipe').getMany();
  }
}
