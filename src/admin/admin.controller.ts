import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BattlePassFactory, Crafting__factory } from 'abi/typechain';
import {
  BattlePass,
  LevelInfoStruct,
  LootboxOptionStruct,
} from 'abi/typechain/BattlePass';
import { IngredientsStruct } from 'abi/typechain/Crafting';
import { ethers } from 'ethers';
import { BattlePassService } from 'src/battle-pass/battle-pass.service';
import { ChainService } from 'src/chain/chain.service';
import { CraftingService } from 'src/crafting/crafting.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { NewLootboxDto } from './dto/NewLootbox.dto';
import { NewRecipeDto } from './dto/NewRecipe.dto';
import { NewSeasonDto } from './dto/NewSeason.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private battlePassService: BattlePassService,
  ) {}
  @Get('check/:creatorId')
  async check(@Param('creatorId') creatorId: number) {
    try {
      const contract = await this.chainService.getBattlePassContract(creatorId);
      return {
        exists: true,
        address: contract.address,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  @Get('seasonId/:creatorId')
  async seasonId(@Param('creatorId') creatorId: number) {
    try {
      const contract = await this.chainService.getBattlePassContract(creatorId);
      return {
        seasonId: (await contract.seasonId()).toNumber(),
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  @Post('deploy')
  async deploy(@Body('creatorId') creatorId: number) {
    try {
      try {
        await this.chainService.getBattlePassContract(creatorId);
        return {
          success: false,
          description: 'Battle Pass already exists!',
        };
      } catch (e) {}
      const bpFactory = this.chainService.getSignerContract(
        this.chainService.battlePassFactory,
      ) as BattlePassFactory;
      const fee = await this.chainService.getMaticFeeData();
      const newbp = await bpFactory.deployBattlePass(creatorId, fee);
      const rc = await newbp.wait();
      const event = rc.events.find(
        (event: any) => event.event === 'BattlePassDeployed',
      );
      if (!event) {
        return {
          success: false,
          description: 'Deployment failed!',
        };
      }
      this.battlePassService.addBattlePassDB(creatorId);
    } catch (e) {
      console.log(e);
      return {
        success: false,
      };
    }
    return {
      success: true,
    };
  }

  @Post('giveXp')
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    try {
      const contract = await this.chainService.getBattlePassContract(
        giveXpDto.creatorId,
      );
      const bp = this.chainService.getSignerContract(contract) as BattlePass;
      const seasonId = await bp.seasonId();
      const fee = await this.chainService.getMaticFeeData();
      await bp.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
      return { success: true };
    } catch (e) {
      console.log(e);
      return { success: false };
    }
  }

  @Post('newLootbox')
  async newLootbox(@Body() newLootboxDto: NewLootboxDto) {
    console.log(newLootboxDto);
    let lootboxId;
    try {
      const jointprob = 0;
      const maxprob = 100;
      const lootboxOption: LootboxOptionStruct[] = [];
      for (let i = 0; i < newLootboxDto.lootboxInfo.length; i++) {
        const option = newLootboxDto.lootboxInfo[i];
        if (jointprob + option.rarity > maxprob) {
          return {
            success: false,
            description: 'Max Probability Exceeded',
          };
        }
        const ids = [];
        const qtys = [];
        for (let j = 0; j < option.rewards.length; j++) {
          const reward = option.rewards[j];
          ids.push(reward.id);
          qtys.push(reward.qty);
        }
        lootboxOption.push({
          ids: ids,
          qtys: qtys,
          rarityRange: [jointprob, jointprob + option.rarity],
        });
      }
      const contract = await this.chainService.getBattlePassContract(
        newLootboxDto.creatorId,
      );
      const bp = this.chainService.getSignerContract(contract) as BattlePass;
      const fee = await this.chainService.getMaticFeeData();
      await (await bp.newLootbox(lootboxOption, fee)).wait(1);
      lootboxId = await bp.lootboxId();
    } catch (e) {
      console.log(e);
      return {
        success: false,
      };
    }
    return {
      success: true,
      lootboxId: lootboxId.toNumber(),
    };
  }

  @Post('newSeason')
  async newSeason(@Body() newSeasonDto: NewSeasonDto) {
    try {
      const levelInfo: LevelInfoStruct[] = [];
      for (let i = 0; i < newSeasonDto.levelDetails.length; i++) {
        const info = newSeasonDto.levelDetails[i];
        levelInfo.push({
          xpToCompleteLevel:
            i != newSeasonDto.levelDetails.length - 1 ? info.xp : 0,
          freeRewardId: info.freeId,
          freeRewardQty: info.freeQty,
          premiumRewardId: info.premId,
          premiumRewardQty: info.premQty,
        });
      }
      const contract = await this.chainService.getBattlePassContract(
        newSeasonDto.creatorId,
      );
      const bp = this.chainService.getSignerContract(contract) as BattlePass;
      const fee = await this.chainService.getMaticFeeData();
      await (await bp.newSeason(levelInfo, fee)).wait(1);
    } catch (e) {
      console.log(e);
      return {
        success: false,
      };
    }
    return {
      success: true,
    };
  }

  @Post('newRecipe')
  async newRecipe(@Body() newRecipeDto: NewRecipeDto) {
    //assume creatorIDs exists (retool)
    try {
      const inputIngredients: IngredientsStruct = {
        battlePasses: [],
        ids: [],
        qtys: [],
      };
      for (let i = 0; i < newRecipeDto.inputIngredients.length; i++) {
        const ingredient = newRecipeDto.inputIngredients[i];
        const address = await this.chainService.getBattlePassAddress(
          ingredient.creatorId,
        );
        inputIngredients.battlePasses.push(address);
        inputIngredients.ids.push(ingredient.id);
        inputIngredients.qtys.push(ingredient.qty);
      }
      const outputIngredients: IngredientsStruct = {
        battlePasses: [],
        ids: [],
        qtys: [],
      };
      for (let i = 0; i < newRecipeDto.outputIngredients.length; i++) {
        const ingredient = newRecipeDto.outputIngredients[i];
        const address = await this.chainService.getBattlePassAddress(
          ingredient.creatorId,
        );
        outputIngredients.battlePasses.push(address);
        outputIngredients.ids.push(ingredient.id);
        outputIngredients.qtys.push(ingredient.qty);
      }
      const rc = (await this.chainService.callCrafting(
        'addRecipe',
        [inputIngredients, outputIngredients],
        null,
        true,
      )) as ethers.providers.TransactionReceipt;
      const event = Crafting__factory.createInterface().parseLog(rc.logs[0]);
      const recipeId = event.args['recipeId'].toNumber();
      this.craftingService.addRecipe(newRecipeDto.creatorId, recipeId);
    } catch (e) {
      console.log(e);
      return { success: false };
    }
    return { success: true };
  }
}
