import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Contract } from 'ethers';
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
    let inputIngredients = await parent.contract.getInputIngredients(
      parent.recipeId
    );
    let ingredients = [];
    for (let x = 0; x <= inputIngredients.tokens.length; x++) {
      let id = inputIngredients.ids[x];
      let qty = inputIngredients.qtys[x];
      let contractDB = await this.contractService.findByAddress(
        inputIngredients.tokens[x]
      );
      if (contractDB.length == 0) continue;
      let contract = await this.contractService.getProviderContract(
        contractDB[0]
      );
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
    let outputIngredients = await parent.contract.getOutputIngredients(
      parent.recipeId
    );
    let ingredients = [];
    for (let x = 0; x <= outputIngredients.tokens.length; x++) {
      let id = outputIngredients.ids[x];
      let qty = outputIngredients.qtys[x];
      let contractDB = await this.contractService.findByAddress(
        outputIngredients.tokens[x]
      );
      if (contractDB.length == 0) continue;
      let contract = await this.contractService.getProviderContract(
        contractDB[0]
      );
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
    let contractDBEntries = await this.contractService.findByType('Crafting');
    if (contractDBEntries.length == 0) return null;
    let contract = await this.contractService.getProviderContract(
      contractDBEntries[0]
    );
    return { contract, recipeId, creatorId };
  }
}
