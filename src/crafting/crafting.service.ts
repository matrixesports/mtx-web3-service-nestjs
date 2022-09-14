import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';
import { RecipeDB } from './crafting.entity';

@Injectable()
export class CraftingService {
  constructor(
    @InjectRepository(RecipeDB)
    private recipeRepository: Repository<RecipeDB>,
    private configService: ConfigService,
  ) {}

  async getOwner(creatorIds: number[]): Promise<
    [
      {
        id: number;
        name: string;
        slug: string;
        pfp: string;
      },
    ]
  > {
    let owners;
    try {
      owners = await axios.post(
        `${
          this.configService.get('SERVICE').userService
        }/api/creator/getRecipes`,
        { ids: creatorIds },
      );
    } catch (e) {
      throw new GraphQLError('Fetch Owner from User-Service Failed!');
    }
    if (owners.length == 0)
      throw new GraphQLError('Owner Not Found In User-Service!');
    return owners.data;
  }
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

  async getAllRecipes() {
    return await this.recipeRepository.find();
  }
}
