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
    return await this.recipeRepository.insert({
      creator_id: creatorId,
      id: recipeId,
    });
  }

  async getRecipes(creatorId: number) {
    return await this.recipeRepository.find({
      where: {
        creator_id: creatorId,
      },
    });
  }

  async checkRecipe(recipeId: number) {
    await this.recipeRepository.find({
      where: {
        id: recipeId,
      },
    });
    return true;
  }
}
