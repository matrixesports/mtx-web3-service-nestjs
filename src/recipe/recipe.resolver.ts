import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CtrType } from 'src/contract/contract.entity';
import { ContractService } from 'src/contract/contract.service';

import { GetRecipeChildDto } from './dto/GetRecipeChild.dto';

@Resolver('Recipe')
export class RecipeResolver {
  constructor(private contractService: ContractService) {}

  @ResolveField()
  async isActive(@Parent() parent: GetRecipeChildDto) {
    return await parent.contract.isActive(parent.recipeId);
  }

  @ResolveField()
  async inputIngredients(@Parent() parent: GetRecipeChildDto) {
    const inputIngredients = await parent.contract.getInputIngredients(
      parent.recipeId
    );
    const ingredients = [];
    // for (let x = 0; x <= inputIngredients.tokens.length; x++) {
    //   let id = inputIngredients.ids[x];
    //   let qty = inputIngredients.qtys[x];
    //   let contractDB;
    //   try {
    //     contractDB = await this.contractService.findOne({
    //       address: inputIngredients.tokens[x],
    //     });
    //   } catch (e) {
    //     continue;
    //   }
    //   let contract = this.contractService.getProviderContract(contractDB);
    //   let uri = await contract.uri(id);
    //   let metadata = await this.metadataService.readFromIPFS(uri);
    //   ingredients.push({
    //     id,
    //     qty,
    //     metadata,
    //   });
    // }

    return ingredients;
  }

  @ResolveField()
  async outputIngredients(@Parent() parent: GetRecipeChildDto) {
    const outputIngredients = await parent.contract.getOutputIngredients(
      parent.recipeId
    );
    const ingredients = [];
    // for (let x = 0; x <= outputIngredients.tokens.length; x++) {
    //   let id = outputIngredients.ids[x];
    //   let qty = outputIngredients.qtys[x];
    //   let contractDB;
    //   try {
    //     contractDB = await this.contractService.findOne({
    //       address: outputIngredients.tokens[x],
    //     });
    //   } catch (e) {
    //     continue;
    //   }
    //   let contract = this.contractService.getProviderContract(contractDB);
    //   let uri = await contract.uri(id);
    //   let metadata = await this.metadataService.readFromIPFS(uri);
    //   ingredients.push({
    //     id,
    //     qty,
    //     metadata,
    //   });
    // }

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
    try {
      const contractDB = await this.contractService.findOne({
        ctr_type: CtrType.CRAFTING,
      });
      const contract = this.contractService.getProviderContract(contractDB);
      return { contract, recipeId, creatorId };
    } catch (e) {
      return null;
    }
  }

  @Mutation()
  async craft(@Args('recipeId') recipeId: number, @Context() context) {
    try {
      const userAddress: string = context.req.headers['user-address'];

      const contractDB = await this.contractService.findOne({
        ctr_type: CtrType.CRAFTING,
      });
      const contract = this.contractService.getSignerContract(contractDB);
      const fee = await this.contractService.getMaticFeeData();
      await contract.craft(recipeId, userAddress, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
