import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeDB } from './crafting.entity';

@Injectable()
export class CraftingService {
  constructor(
    @InjectRepository(RecipeDB)
    private recipeRepository: Repository<RecipeDB>,
  ) {}

  async addRecipe(creatorId: number, recipeId: number) {
    try {
      return await this.recipeRepository.insert({
        creator_id: creatorId,
        id: recipeId,
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async getRecipes(creatorId: number) {
    try {
      return await this.recipeRepository.find({
        where: {
          creator_id: creatorId,
        },
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async checkRecipe(recipeId: number) {
    try {
      await this.recipeRepository.find({
        where: {
          id: recipeId,
        },
      });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
