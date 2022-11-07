import { Body, Controller, Get, HttpException, Param, Post, UseFilters } from '@nestjs/common';
import { BattlePassFactory, Crafting__factory } from 'abi/typechain';
import { BattlePass, LevelInfoStruct, LootboxOptionStruct } from 'abi/typechain/BattlePass';
import { IngredientsStruct } from 'abi/typechain/Crafting';
import { BattlePassService } from 'src/battlepass/battlepass.service';
import { ChainService } from 'src/chain/chain.service';
import { EthersFilter, IResponseError, TypeORMFilter } from 'src/common/filters';
import { CraftingService } from 'src/crafting/crafting.service';
import { RewardType } from 'src/graphql.schema';
import {
  CreateLootboxDto,
  CreateLootdropDto,
  CreateRecipeDto,
  CreateSeasonDto,
  MintPremPassDto,
  MintRepDto,
  MintXpDto,
  REPUTATION_TOKEN_ID,
} from './api.dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import * as moment from 'moment';
import { RewardService } from 'src/reward/reward.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { InventoryService } from 'src/inventory/inventory.service';
import { LootdropReward, LootdropRS } from 'src/reward/reward.dto';
import { MicroserviceService } from 'src/microservice/microservice.service';
import { LootdropAlert, PremPassAlert, SeasonAlert } from 'src/microservice/microservice.dto';

@Controller()
@UseFilters(TypeORMFilter, EthersFilter)
export class ApiController {
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private battlePassService: BattlePassService,
    @InjectRedis() private readonly redis: Redis,
    private inventoryService: InventoryService,
    private rewardService: RewardService,
    private microserviceService: MicroserviceService,
  ) {}

  @Get('battlepass/check/:creatorId')
  async check(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    return {
      exists: true,
      address: contract.address,
    };
  }

  @Get('battlepass/info/:creatorId')
  async getBattlePassDB(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = await contract.seasonId();
    const battlePassDB = await this.battlePassService.getBattlePass(creatorId).catch((error) => {
      throw new HttpException(error.message, 500);
    });
    return {
      price: battlePassDB.price,
      currency: battlePassDB.currency,
      name: battlePassDB.name,
      description: battlePassDB.description,
      seasonId: seasonId.toNumber(),
      address: contract.address,
    };
  }

  @Get('battlepass/season/:creatorId')
  async getSeasonId(@Param('creatorId') creatorId: number) {
    const seasonId = await this.battlePassService.getSeasonId(creatorId);
    return seasonId;
  }

  @Get('check/reputation/:creatorId/:userAddress')
  async getReputation(
    @Param('creatorId') creatorId: number,
    @Param('userAddress') userAddress: string,
  ) {
    const reputation = await this.battlePassService.getBalance(
      creatorId,
      userAddress,
      REPUTATION_TOKEN_ID,
    );
    return { reputation };
  }

  @ApiOkResponse({ type: LootdropReward })
  @Get('lootdrop/:creatorId')
  async getLootdrop(@Param('creatorId') creatorId: number): Promise<LootdropReward> {
    const cache = await this.rewardService.getlootdrop(creatorId);
    const reward = await this.inventoryService.createRewardObj(creatorId, cache.rewardId, 1);
    return {
      creatorId,
      reward,
      requirements: cache.requirements,
      threshold: cache.threshold,
      start: cache.start,
      end: cache.end,
      url: cache.url,
    };
  }

  @Post('mint/prempass')
  async mintPremiumPass(@Body() mintPremPassDto: MintPremPassDto) {
    const seasonId = await this.battlePassService.getSeasonId(mintPremPassDto.creatorId);
    await this.battlePassService.mint(
      mintPremPassDto.creatorId,
      mintPremPassDto.userAddress,
      seasonId,
      1,
    );
    const streaks = await this.battlePassService.getStreaks(
      mintPremPassDto.creatorId,
      mintPremPassDto.userAddress,
    );
    const userInfo = await this.microserviceService.getUserInfo(mintPremPassDto.userAddress);
    const alert: PremPassAlert = {
      creatorId: mintPremPassDto.creatorId,
      userAddress: mintPremPassDto.userAddress,
      name: userInfo.name,
      pfp: userInfo.pfp,
      seasonId,
      streaks,
    };
    this.microserviceService.sendPremPassAlert(alert);
    return { success: true };
  }

  @Post('mint/reputation')
  async mintReputation(@Body() mintRepDto: MintRepDto) {
    await this.battlePassService.mint(
      mintRepDto.creatorId,
      mintRepDto.userAddress,
      REPUTATION_TOKEN_ID,
      mintRepDto.amount,
    );
    return { success: true };
  }

  @Post('mint/xp') async mintXp(@Body() mintXpDto: MintXpDto) {
    await this.battlePassService.giveXp(
      mintXpDto.creatorId,
      this.chainService.getAddress(mintXpDto.userAddress),
      mintXpDto.amount,
    );
    return { success: true };
  }

  @Post('deploy/battlepass')
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
    const event = rc.events.find((event: any) => event.event === 'BattlePassDeployed');
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

  @Post('create/lootbox')
  async createLootbox(@Body() createLootboxDto: CreateLootboxDto) {
    let jointprob = 0;
    const maxprob = 100;
    const lootboxOption: LootboxOptionStruct[] = [];
    for (let i = 0; i < createLootboxDto.lootboxInfo.length; i++) {
      const option = createLootboxDto.lootboxInfo[i];
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
    const contract = await this.chainService.getBattlePassContract(createLootboxDto.creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (await bp.newLootbox(lootboxOption, fee)).wait(1);
    const lootboxId = await bp.lootboxId();
    await this.inventoryService
      .addMetadata(
        createLootboxDto.creatorId,
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

  @Post('create/season')
  async createSeason(@Body() createSeasonDto: CreateSeasonDto) {
    const levelInfo: LevelInfoStruct[] = [];
    for (let i = 0; i < createSeasonDto.levelDetails.length; i++) {
      const info = createSeasonDto.levelDetails[i];
      levelInfo.push({
        xpToCompleteLevel: i != createSeasonDto.levelDetails.length - 1 ? info.xp : 0,
        freeRewardId: info.freeId,
        freeRewardQty: info.freeQty,
        premiumRewardId: info.premId,
        premiumRewardQty: info.premQty,
      });
    }
    const contract = await this.chainService.getBattlePassContract(createSeasonDto.creatorId);
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (await bp.newSeason(levelInfo, fee)).wait(1);
    const seasonId = (await contract.seasonId()).toNumber();
    const maxLevel = (await contract.getMaxLevel(seasonId)).toNumber();
    await this.battlePassService.getLevelInfo(
      createSeasonDto.creatorId,
      contract,
      seasonId,
      maxLevel,
    );
    const battlePassDB = await this.battlePassService.getBattlePass(createSeasonDto.creatorId);
    const alert: SeasonAlert = {
      creatorId: createSeasonDto.creatorId,
      seasonId,
      price: battlePassDB.price,
      currency: battlePassDB.currency,
      name: battlePassDB.name,
      description: battlePassDB.description,
      end: battlePassDB.end_date.toString(),
    };
    this.microserviceService.sendSeasonAlert(alert);
    return { success: true };
  }

  @Post('create/recipe')
  async createRecipe(@Body() createRecipeDto: CreateRecipeDto) {
    // assume creatorIDs exists (retool)
    const inputIngredients: IngredientsStruct = {
      battlePasses: [],
      ids: [],
      qtys: [],
    };
    for (let i = 0; i < createRecipeDto.inputIngredients.length; i++) {
      const ingredient = createRecipeDto.inputIngredients[i];
      const address = await this.chainService.getBattlePassAddress(ingredient.creatorId);
      inputIngredients.battlePasses.push(address);
      inputIngredients.ids.push(ingredient.id);
      inputIngredients.qtys.push(ingredient.qty);
    }
    const outputIngredients: IngredientsStruct = {
      battlePasses: [],
      ids: [],
      qtys: [],
    };
    for (let i = 0; i < createRecipeDto.outputIngredients.length; i++) {
      const ingredient = createRecipeDto.outputIngredients[i];
      const address = await this.chainService.getBattlePassAddress(ingredient.creatorId);
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
    this.craftingService.addRecipe(createRecipeDto.creatorId, recipeId).catch((error) => {
      throw new HttpException(error.message, 500);
    });
    return { success: true };
  }

  @Post('create/lootdrop')
  async createLootdrop(@Body() createLootdropDto: CreateLootdropDto) {
    const shortUrl = await this.microserviceService.createUrl(createLootdropDto.creatorId);
    const start = moment.utc(createLootdropDto.start).utcOffset('-07:00').toDate();
    const end = moment.utc(createLootdropDto.end).utcOffset('-07:00').toDate();
    if (start > end) throw new HttpException('Start Must Be Before End!', 500);
    const nw = moment().utcOffset('-07:00').toDate();
    const ttl =
      nw > start
        ? Math.floor((end.getTime() - start.getTime()) / 1000)
        : Math.floor((end.getTime() - nw.getTime()) / 1000);
    const target = `lootdrop-${createLootdropDto.creatorId}`;
    const lootdrop: LootdropRS = { ...createLootdropDto, url: shortUrl };
    await this.redis.set(target, JSON.stringify(lootdrop), 'EX', ttl);
    await this.redis.set(target + '-qty', createLootdropDto.qty, 'EX', ttl);
    await this.redis.del(target + '-list');
    const reward = await this.inventoryService.createRewardObj(
      createLootdropDto.creatorId,
      createLootdropDto.rewardId,
      1,
    );
    const alert: LootdropAlert = {
      creatorId: createLootdropDto.creatorId,
      requirements: createLootdropDto.requirements,
      threshold: createLootdropDto.threshold,
      reward,
      start: start.toString(),
      end: end.toString(),
      url: shortUrl,
    };
    this.microserviceService.sendLootdropAlert(alert);
    return { success: true };
  }
}
