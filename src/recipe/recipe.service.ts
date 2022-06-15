import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { Contract } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { DataSource, Repository } from 'typeorm';
import { Recipe } from './recipe.entity';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepo: Repository<Recipe>,
    private dataSource: DataSource,
    private contractService: ContractService,
  ) {}

  async getRecipeContract(creatorId: number): Promise<ethers.Contract> {
    let contract: Contract = await this.contractService.findOneByCreatorAndType(
      creatorId,
      'Workshop',
    );
    return await this.contractService.create(contract);
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

  async getRecipe() {
    let contract = new Contract();
    contract.abi = { x: 1 };
    contract.address = '0x1';
    contract.creator_id = 1;
    contract.ctr_type = 'Distributor';
    contract.name = 'x';
    contract.network = 'y';
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(contract);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
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
