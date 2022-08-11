import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Crafting__factory } from 'abi/typechain';
import { BigNumber, ethers } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { ContractCall } from 'pilum';
import { BattlePassService } from 'src/battle-pass/battle-pass.service';
import { ChainService } from 'src/chain/chain.service';
import { Reward } from 'src/graphql.schema';
import { CraftingService } from './crafting.service';
import { GetRecipeDto } from './dto/getRecipe.dto';

@Resolver('Recipe')
export class CraftingResolver {
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private battlePassService: BattlePassService,
  ) {}

  @Query()
  async getRecipe(
    @Args('creatorId') creatorId: number,
    @Args('recipeId') recipeId: number,
  ): Promise<GetRecipeDto> {
    return {
      creatorId,
      recipeId,
    };
  }

  @Query()
  async getRecipes(@Args('creatorId') creatorId: number) {
    const dtos: GetRecipeDto[] = [];
    const recipes = await this.craftingService.getRecipes(creatorId);
    if (!recipes) return null;
    const calls: ContractCall[] = [];
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

  @Mutation()
  async craft(@Args('recipeId') recipeId: number, @Context() context) {
    if (!this.craftingService.checkRecipe(recipeId)) return { success: false };
    try {
      const userAddress: string = context.req.headers['user-address'];
      const rc = (await this.chainService.callCrafting(
        'craft',
        [recipeId],
        userAddress,
        true,
      )) as Result;
    } catch (e) {
      console.log(e);
      return { success: false };
    }
    return { success: true };
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
    try {
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
        const reward = await this.battlePassService.createRewardObj(
          parent.creatorId,
          rc[0][1][i],
          rc[0][2][i],
        );
        rewards.push(reward);
      }
      return rewards;
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  @ResolveField()
  async outputIngredients(@Parent() parent: GetRecipeDto) {
    try {
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
        const reward = await this.battlePassService.createRewardObj(
          parent.creatorId,
          rc[0][1][i],
          rc[0][2][i],
        );
        rewards.push(reward);
      }
      return rewards;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
}
