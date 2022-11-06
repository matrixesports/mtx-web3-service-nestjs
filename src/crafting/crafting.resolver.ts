import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ChainService } from 'src/chain/chain.service';
import { Reward } from 'src/graphql.schema';
import { CraftingService } from './crafting.service';
import { GetRecipeDto } from './crafting.dto';
import { InventoryService } from 'src/inventory/inventory.service';

@Resolver('Recipe')
export class CraftingResolver {
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private inventoryService: InventoryService,
  ) {}

  /*
|========================| QUERY |========================|
*/

  @Query()
  async getRecipe(
    @Args('creatorId') creatorId: number,
    @Args('recipeId') recipeId: number,
  ): Promise<GetRecipeDto> {
    await this.craftingService.getRecipe(creatorId, recipeId);
    const recipe = await this.craftingService.getRecipe(creatorId, recipeId);
    const owner = await this.craftingService.getOwner([creatorId]);
    const ingridients = await this.craftingService.getIngridients([recipe]);
    return {
      creatorId,
      recipeId,
      recipe: {
        input: ingridients[0].input,
        output: ingridients[0].output,
      },
      active: recipe.active,
      owner: {
        pfp: owner[0].pfp,
        slug: owner[0].slug,
        name: owner[0].name,
      },
    };
  }

  @Query()
  async getRecipes(@Args('creatorId') creatorId: number) {
    const dtos: GetRecipeDto[] = [];
    const recipes = await this.craftingService.getActiveRecipes(creatorId);
    const owners = await this.craftingService.getOwner([creatorId]);
    const ingridients = await this.craftingService.getIngridients(recipes);
    const owner = {
      pfp: owners[0].pfp,
      slug: owners[0].slug,
      name: owners[0].name,
    };
    for (let i = 0; i < ingridients.length; i++) {
      dtos.push({
        creatorId: creatorId,
        recipeId: recipes[i].id,
        recipe: {
          input: ingridients[i].input,
          output: ingridients[i].output,
        },
        active: recipes[0].active,
        owner,
      });
    }
    return dtos;
  }

  @Query()
  async getAllRecipes() {
    const dtos: GetRecipeDto[] = [];
    const recipes = await this.craftingService.getAllActiveRecipes();
    const creators = [...new Set(recipes.map((recipe) => recipe.creator_id))];
    const owners = await this.craftingService.getOwner(creators);
    if (creators.length != owners.length) throw new Error('Invalid Recipes or Creator!');
    const ingridients = await this.craftingService.getIngridients(recipes);
    for (let i = 0; i < ingridients.length; i++) {
      dtos.push({
        creatorId: recipes[i].creator_id,
        recipeId: recipes[i].id,
        recipe: {
          input: ingridients[i].input,
          output: ingridients[i].output,
        },
        active: recipes[i].active,
        owner: {
          pfp: owners[i].pfp,
          name: owners[i].name,
          slug: owners[i].slug,
        },
      });
    }
    return dtos;
  }

  /*
  |========================| MUTATION |========================|
  */

  @Mutation()
  async craft(@Args('recipeId') recipeId: number, @Context() context) {
    await this.craftingService.checkRecipe(recipeId).catch((error) => {
      throw error;
    });
    const userAddress: string = context.req.headers['user-address'];
    await this.chainService.callCrafting('craft', [recipeId], userAddress);
    return { success: true };
  }

  /*
  |========================| FIELDS |========================|
  */
  @ResolveField()
  async owner(@Parent() parent: GetRecipeDto) {
    return {
      name: parent.owner.name,
      pfp: parent.owner.pfp,
      creatorId: parent.creatorId,
      slug: parent.owner.slug,
    };
  }

  @ResolveField()
  async recipeId(@Parent() parent: GetRecipeDto) {
    return parent.recipeId;
  }

  @ResolveField()
  async isActive(@Parent() parent: GetRecipeDto) {
    return parent.active;
  }

  @ResolveField()
  async inputIngredients(@Parent() parent: GetRecipeDto) {
    const rewards: Reward[] = [];
    for (let i = 0; i < parent.recipe.input.battlePasses.length; i++) {
      const reward = await this.inventoryService.createRewardObj(
        parent.creatorId,
        parent.recipe.input.ids[i],
        parent.recipe.input.qtys[i],
      );
      rewards.push(reward);
    }
    return rewards;
  }

  @ResolveField()
  async outputIngredients(@Parent() parent: GetRecipeDto) {
    const rewards: Reward[] = [];
    for (let i = 0; i < parent.recipe.output.battlePasses.length; i++) {
      const reward = await this.inventoryService.createRewardObj(
        parent.creatorId,
        parent.recipe.output.ids[i],
        parent.recipe.output.qtys[i],
      );
      rewards.push(reward);
    }
    return rewards;
  }
}
