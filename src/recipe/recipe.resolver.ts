import { Logger } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ethers } from 'ethers';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { GetRecipeChildDto } from './dto/GetRecipeChild.dto';

@Resolver('Recipe')
export class RecipeResolver {
  constructor(
    private contractService: ContractService,
    private metadataService: MetadataService
  ) {}

  @ResolveField()
  async isActive(@Parent() parent: GetRecipeChildDto) {
    return await parent.contract.isActive(parent.recipeId);
  }

  @ResolveField()
  async inputIngredients(@Parent() parent: GetRecipeChildDto) {
    const logger = new Logger(this.inputIngredients.name);
    let inputIngredients = await parent.contract.getInputIngredients(
      parent.recipeId
    );
    let ingredients = [];
    for (let x = 0; x <= inputIngredients.tokens.length; x++) {
      let id = inputIngredients.ids[x];
      let qty = inputIngredients.qtys[x];
      let contractDB;
      try {
        contractDB = await this.contractService.findOne({
          address: inputIngredients.tokens[x],
        });
      } catch (e) {
        logger.warn(e);
        continue;
      }
      let contract = this.contractService.getProviderContract(contractDB);
      let uri = await contract.uri(id);
      let metadata = await this.metadataService.readFromIPFS(uri);
      ingredients.push({
        id,
        qty,
        metadata,
      });
    }

    return ingredients;
  }

  @ResolveField()
  async outputIngredients(@Parent() parent: GetRecipeChildDto) {
    const logger = new Logger(this.outputIngredients.name);
    let outputIngredients = await parent.contract.getOutputIngredients(
      parent.recipeId
    );
    let ingredients = [];
    for (let x = 0; x <= outputIngredients.tokens.length; x++) {
      let id = outputIngredients.ids[x];
      let qty = outputIngredients.qtys[x];
      let contractDB;
      try {
        contractDB = await this.contractService.findOne({
          address: outputIngredients.tokens[x],
        });
      } catch (e) {
        logger.warn(e);
        continue;
      }
      let contract = this.contractService.getProviderContract(contractDB);
      let uri = await contract.uri(id);
      let metadata = await this.metadataService.readFromIPFS(uri);
      ingredients.push({
        id,
        qty,
        metadata,
      });
    }

    return ingredients;
  }

  //   @Query()
  //   async getRecipes(
  //     @Args('creatorId') creatorId: number
  //   ): Promise<{ contract: Contract }> {
  //     let contractDBEntries = await this.contractService.findRecipe();
  //     if (contractDBEntries.length == 0) return null;
  //     let contract = await this.contractService.getProviderContract(
  //       contractDBEntries[0]
  //     );
  //     return { contract };
  //   }

  @Query()
  async getRecipe(
    @Args('creatorId') creatorId: number,
    @Args('recipeId') recipeId: number
  ): Promise<GetRecipeChildDto> {
    const logger = new Logger(this.getRecipe.name);
    try {
      let contractDB = await this.contractService.findOne({
        ctr_type: CtrType.CRAFTING,
      });
      let contract = this.contractService.getProviderContract(contractDB);
      return { contract, recipeId, creatorId };
    } catch (e) {
      logger.warn(e);
      return null;
    }
  }

  @Mutation()
  async craft(@Args('recipeId') recipeId: number, @Context() context) {
    const logger = new Logger(this.craft.name);
    try {
      let userAddress: string = context.req.headers['user-address'];

      let contractDB = await this.contractService.findOne({
        ctr_type: CtrType.CRAFTING,
      });
      let contract = this.contractService.getSignerContract(contractDB);
      let fee = await this.contractService.getMaticFeeData();
      await contract.craft(recipeId, userAddress, fee);
      return { success: true };
    } catch (e) {
      logger.warn(e);
      return { success: false };
    }
  }
}
