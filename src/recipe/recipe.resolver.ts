import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ethers } from 'ethers';
import { RecipeService } from './recipe.service';

// only show active recipes
@Resolver('Recipe')
export class RecipeResolver {
  constructor(private recipeService: RecipeService) {}

  //   @Query()
  //   async getRecipe(@Args() args) {
  //     return {
  //       contract: await this.recipeService.getRecipeContract(args.creatorId),
  //       recipeId: args.recipeId,
  //     };
  //   }

  //   @ResolveField()
  //   async inputIngredients(@Parent() parent) {
  //     console.log(parent);
  //     return 'x';
  //   }

  //   @ResolveField()
  //   async outputIngredients(@Parent() parent) {
  //     return 'xx';
  //   }

  //    async getRecipes(parent: any, args: GetPassArgs) {
  //             try {
  //                 let res = await query("SELECT recipe_id from recipes where creator_id = $1", [
  //                     args.creatorId,
  //                 ]);
  //                 let ctr = await query(
  //                     "select address from contracts where contract_type=$1 AND creator_id = $2",
  //                     ["Crafting", args.creatorId]
  //                 );
  //                 if (res == null || res.rowCount == 0 || ctr == null || ctr.rowCount == 0) {
  //                     return null;
  //                 }
  //                 let contract = await getContractFromAddress(ctr.rows[0].address, false, false);
  //                 if (contract == null) return null;

  //                 let recipes = [];
  //                 for (let x = 0; x < res.rowCount; x++) {
  //                     recipes.push({
  //                         inputIngredients: await contract.recipe(res.rows[x].recipe_id, 0),
  //                         outputIngredients: await contract.recipe(res.rows[x].recipe_id, 1),
  //                     });
  //                 }
  //             } catch (e) {
  //                 console.log(`cannot get recipes, ${args.creatorId}`, e);
  //                 return null;
  //             }
  //         },
  //     },
  //     async craft(parent: any, args: CraftInput, context: ContextObj): Promise<MutationResponse> {
  //             try {
  //                 let ctr = await query(
  //                     "select address from contracts where contract_type=$1 AND creator_id = $2",
  //                     ["Crafting", args.input.creatorId]
  //                 );
  //                 if (ctr == null || ctr.rowCount == 0) {
  //                     return {
  //                         success: false,
  //                         description: `Error crafting item, ${args.input}, contact matrix on discord`,
  //                     };
  //                 }
  //                 let contractInfo = await getContractInfo(ctr.rows[0].address);
  //                 if (contractInfo == null) {
  //                     return {
  //                         success: false,
  //                         description: `Error crafting item, ${args.input}, contact matrix on discord`,
  //                     };
  //                 }
  //                 let provider = await getProvider(contractInfo.network);
  //                 let contract = await getSignerContract(
  //                     ctr.rows[0].address,
  //                     contractInfo.abi,
  //                     contractInfo.network
  //                 );

  //                 let fee = await getMaticFeeData();
  //                 let tx = await contract.craft(args.input.recipeId, fee);
  //                 await provider.waitForTransaction(tx.hash, MATIC_NUMBER_OF_BLOCKS_TO_WAIT);
  //                 console.log("CRAFTED ITEM", args.input);
  //                 return {
  //                     success: true,
  //                     description: "nice",
  //                 };
  //             } catch (e) {
  //                 console.log("CANNOT craft item", args.input, e);
  //                 return {
  //                     success: false,
  //                     description: "error, contact matrix on discord",
  //                 };
  //             }
  //         },
}
