import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { BattlePass__factory, Crafting__factory } from 'abi/typechain';
import { BigNumber } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battle-pass/battle-pass.service';
import { ChainService } from 'src/chain/chain.service';
import { Reward } from 'src/graphql.schema';
import { CraftingService } from './crafting.service';
import { GetRecipeDto } from './crafting.dto';
import { GraphQLError } from 'graphql';

@Resolver('Recipe')
export class CraftingResolver {
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private battlePassService: BattlePassService,
  ) {}

  /*
|========================| QUERY |========================|
*/

  @Query()
  async getRecipe(
    @Args('creatorId') creatorId: number,
    @Args('recipeId') recipeId: number,
  ): Promise<GetRecipeDto> {
    const recipes = await this.craftingService.getRecipes(creatorId);
    if (!recipes.length) throw new Error('Owner Not Found!');
    if (!recipes.find((recipe) => recipe.id == recipeId))
      throw new Error('Recipe Not Found!');
    const owner = await this.craftingService
      .getOwner([creatorId])
      .catch((error) => {
        throw error;
      });
    return {
      creatorId,
      recipeId,
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
    const calls: ContractCall[] = [];
    const recipes = await this.craftingService.getRecipes(creatorId);
    if (!recipes.length) throw new GraphQLError('Recipes Not Found!');
    const owner = await this.craftingService
      .getOwner([creatorId])
      .catch((error) => {
        throw error;
      });
    const iface = Crafting__factory.createInterface();
    const infragment = iface.getFunction('getInputIngredients');
    const outfragment = iface.getFunction('getOutputIngredients');
    for (let i = 0; i < recipes.length; i++) {
      calls.push({
        reference: 'getInputIngredients',
        address: this.chainService.craftingProxy.address,
        abi: [infragment],
        method: 'getInputIngredients',
        params: [recipes[i].id],
        value: 0,
      });
      calls.push({
        reference: 'getOutputIngredients',
        address: this.chainService.craftingProxy.address,
        abi: [outfragment],
        method: 'getOutputIngredients',
        params: [recipes[i].id],
        value: 0,
      });
      dtos.push({
        creatorId: creatorId,
        recipeId: recipes[i].id,
        owner: {
          pfp: owner[0].pfp,
          slug: owner[0].slug,
          name: owner[0].name,
        },
      });
    }
    const results = await this.chainService.multicall(calls);
    if (!results) return null;
    for (let i = 0, j = 0; i < results.length - 1; i += 2, j++) {
      const input = iface.decodeFunctionResult(
        'getInputIngredients',
        results[i].returnData[1],
      );
      const output = iface.decodeFunctionResult(
        'getOutputIngredients',
        results[i + 1].returnData[1],
      );
      dtos[j] = {
        inputIngredients: input,
        outputIngredients: output,
        ...dtos[j],
      };
    }
    return dtos;
  }

  @Query()
  async getAllRecipes() {
    const dtos: GetRecipeDto[] = [];
    const calls: ContractCall[] = [];
    const recipes = await this.craftingService.getAllRecipes();
    if (!recipes.length) throw new Error('Recipes Not Found!');
    const creators = [...new Set(recipes.map((recipe) => recipe.creator_id))];
    const owners = await this.craftingService
      .getOwner(creators)
      .catch((error) => {
        throw error;
      });
    if (creators.length != owners.length)
      throw new Error('Invalid Recipes or Creator!');
    const iface = Crafting__factory.createInterface();
    const infragment = iface.getFunction('getInputIngredients');
    const outfragment = iface.getFunction('getOutputIngredients');
    for (let i = 0; i < creators.length; i++) {
      const owner = owners.find((owner) => owner.id == creators[i]);
      for (let k = 0; k < recipes.length; k++) {
        if (recipes[k].creator_id != creators[i]) continue;
        calls.push({
          reference: 'getInputIngredients',
          address: this.chainService.craftingProxy.address,
          abi: [infragment],
          method: 'getInputIngredients',
          params: [recipes[k].id],
          value: 0,
        });
        calls.push({
          reference: 'getOutputIngredients',
          address: this.chainService.craftingProxy.address,
          abi: [outfragment],
          method: 'getOutputIngredients',
          params: [recipes[k].id],
          value: 0,
        });
        dtos.push({
          creatorId: creators[i],
          recipeId: recipes[k].id,
          owner: {
            pfp: owner?.pfp,
            slug: owner?.slug,
            name: owner.name,
          },
        });
      }
    }
    const results = await this.chainService.multicall(calls);
    if (!results) return null;
    for (let i = 0, j = 0; i < results.length - 1; i += 2, j++) {
      const input = iface.decodeFunctionResult(
        'getInputIngredients',
        results[i].returnData[1],
      );
      const output = iface.decodeFunctionResult(
        'getOutputIngredients',
        results[i + 1].returnData[1],
      );
      dtos[j] = {
        inputIngredients: input,
        outputIngredients: output,
        ...dtos[j],
      };
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
    await this.chainService.callCrafting(
      'craft',
      [recipeId],
      userAddress,
      true,
    );
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
    return BigNumber.from(parent.recipeId);
  }

  @ResolveField()
  async isActive(@Parent() parent: GetRecipeDto) {
    const rc = (await this.chainService.callCrafting(
      'isActive',
      [parent.recipeId],
      null,
      false,
    )) as Result;
    return rc[0];
  }

  @ResolveField()
  async inputIngredients(@Parent() parent: GetRecipeDto) {
    const rc = parent.inputIngredients
      ? parent.inputIngredients
      : ((await this.chainService.callCrafting(
          'getInputIngredients',
          [parent.recipeId],
          null,
          false,
        )) as Result);
    const rewards: Reward[] = [];
    for (let i = 0; i < rc[0][0].length; i++) {
      const bp = BattlePass__factory.connect(
        rc[0][0][i],
        this.chainService.provider,
      );
      const reward = await this.battlePassService.createRewardObj(
        (await bp.creatorId()).toNumber(),
        rc[0][1][i],
        rc[0][2][i],
      );
      rewards.push(reward);
    }
    return rewards;
  }

  @ResolveField()
  async outputIngredients(@Parent() parent: GetRecipeDto) {
    const rc = parent.outputIngredients
      ? parent.outputIngredients
      : ((await this.chainService.callCrafting(
          'getOutputIngredients',
          [parent.recipeId],
          null,
          false,
        )) as Result);
    const rewards: Reward[] = [];
    for (let i = 0; i < rc[0][0].length; i++) {
      const bp = BattlePass__factory.connect(
        rc[0][0][i],
        this.chainService.provider,
      );
      const reward = await this.battlePassService.createRewardObj(
        (await bp.creatorId()).toNumber(),
        rc[0][1][i],
        rc[0][2][i],
      );
      rewards.push(reward);
    }
    return rewards;
  }
}
