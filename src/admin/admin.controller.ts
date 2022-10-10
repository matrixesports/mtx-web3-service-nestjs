import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { BattlePassFactory, Crafting__factory } from 'abi/typechain';
import {
  BattlePass,
  LevelInfoStruct,
  LootboxOptionStruct,
} from 'abi/typechain/BattlePass';
import { IngredientsStruct } from 'abi/typechain/Crafting';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ChainService } from 'src/chain/chain.service';
import {
  EthersFilter,
  IResponseError,
  TypeORMFilter,
} from 'src/common/filters';
import { CraftingService } from 'src/crafting/crafting.service';
import { RewardType } from 'src/graphql.schema';
import { MetadataService } from 'src/metadata/metadata.service';
import {
  GiveXpDto,
  MintReputationDto,
  NewLootboxDto,
  NewLootdropDto,
  NewRecipeDto,
  NewSeasonDto,
  ShortUrl,
} from './admin.dto';
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';

@Controller('admin')
@UseFilters(TypeORMFilter, EthersFilter)
export class AdminController {
  CREATOR_TOKEN_ID = 1000;
  private readonly logger = new Logger(AdminController.name);
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private battlePassService: BattlePassService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metadataService: MetadataService,
    private config: ConfigService,
    @Inject('TWITCH_SERVICE') private tcpClient: ClientProxy,
  ) {}

  /*
|========================| GET |========================|
*/

  @Get('check/:creatorId')
  async check(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    return {
      exists: true,
      address: contract.address,
    };
  }

  @Get('seasonId/:creatorId')
  async seasonId(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    return {
      seasonId: (await contract.seasonId()).toNumber(),
    };
  }

  /*
|========================| POST |========================|
*/

  @Post('deploy')
  async deploy(@Body('creatorId') creatorId: number) {
    if (await this.chainService.isBattlePassDeployed(creatorId)) {
      return {
        success: false,
        message: 'Battle Pass already exists!',
      } as IResponseError;
    }
    const bpFactory = this.chainService.getSignerContract(
      this.chainService.battlePassFactory,
    ) as BattlePassFactory;
    const fee = await this.chainService.getMaticFeeData();
    const rc = await (await bpFactory.deployBattlePass(creatorId, fee)).wait(1);
    const event = rc.events.find(
      (event: any) => event.event === 'BattlePassDeployed',
    );
    if (!event) {
      return {
        success: false,
        description: 'Deployment failed!',
      };
    }
    this.battlePassService.addBattlePass(creatorId).catch((error) => {
      throw new HttpException(error.message, 500);
    });
    return {
      success: true,
    };
  }

  @Post('giveXp')
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    const contract = await this.chainService.getBattlePassContract(
      giveXpDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee)
    ).wait(1);
    return { success: true };
  }

  @Post('newLootbox')
  async newLootbox(@Body() newLootboxDto: NewLootboxDto) {
    let jointprob = 0;
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
      jointprob += option.rarity;
    }
    if (jointprob != maxprob) {
      return {
        success: false,
        description: 'Joint Probability != Max Probability',
      };
    }
    const contract = await this.chainService.getBattlePassContract(
      newLootboxDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (await bp.newLootbox(lootboxOption, fee)).wait(1);
    const lootboxId = await bp.lootboxId();
    await this.metadataService
      .addMetadata(
        newLootboxDto.creatorId,
        lootboxId.toNumber(),
        'TODO',
        'TODO',
        'TODO',
        RewardType.LOOTBOX,
      )
      .catch((error) => {
        throw new HttpException(error.message, 500);
      });
    return {
      success: true,
      lootboxId: lootboxId.toNumber(),
    };
  }

  @Post('newSeason')
  async newSeason(@Body() newSeasonDto: NewSeasonDto) {
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
    return { success: true };
  }

  @Post('newRecipe')
  async newRecipe(@Body() newRecipeDto: NewRecipeDto) {
    // assume creatorIDs exists (retool)
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
    const rc = await this.chainService.callCrafting(
      'addRecipe',
      [inputIngredients, outputIngredients],
      null,
    );
    const event = Crafting__factory.createInterface().parseLog(rc.logs[0]);
    const recipeId = event.args['recipeId'].toNumber();
    this.craftingService
      .addRecipe(newRecipeDto.creatorId, recipeId)
      .catch((error) => {
        throw new HttpException(error.message, 500);
      });
    return { success: true };
  }

  @Post('mint/reputation')
  async mintReputation(@Body() mintReputationDto: MintReputationDto) {
    const contract = await this.chainService.getBattlePassContract(
      mintReputationDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.mint(
        mintReputationDto.userAddress,
        this.CREATOR_TOKEN_ID,
        mintReputationDto.amount,
        fee,
      )
    ).wait(1);
    return { success: true };
  }

  @Post('newLootdrop')
  async newLootdrop(@Body() newLootdropDto: NewLootdropDto) {
    const startPST = new Date(newLootdropDto.start).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    const endPST = new Date(newLootdropDto.end).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    const start = new Date(startPST);
    const end = new Date(endPST);
    if (start > end) throw new HttpException('Start Must Be Before End!', 500);
    const nwPST = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    const nw = new Date(nwPST);
    const ttl =
      nw > start
        ? Math.floor((end.getTime() - start.getTime()) / 1000)
        : Math.floor((end.getTime() - nw.getTime()) / 1000);
    try {
      await this.cacheManager.set<NewLootdropDto>(
        `lootdrop-${newLootdropDto.creatorId}`,
        newLootdropDto,
        { ttl },
      );
    } catch (error) {
      this.logger.error({
        operation: 'Cache Write',
        error,
      });
    }

    // the url service payload
    const urlpayload = {
      creatorId: newLootdropDto.creatorId,
    };
    // make the call to the url service with the creator id
    try {
      const {
        data: { shortUrl },
      } = await axios.post<ShortUrl>(
        `${this.config.get<string>('SERVICE.urlShortenerService')}/createurl`,
        urlpayload,
      );
      // then call the twitch service to show the alert on stream
      this.tcpClient.emit('drop-activated', {
        creatorId: newLootdropDto.creatorId,
        reward: newLootdropDto.rewardId,
        criteria: newLootdropDto.requirements,
        url: shortUrl,
      });
      return { success: true };
    } catch (error) {
      this.logger.error({
        operation: 'Shorten Lootdrop url',
        error,
      });
    }
  }
}
