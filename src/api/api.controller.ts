import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UseFilters,
  Logger,
  Inject,
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
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateLootboxDto,
  CreateLootdropDto,
  CreateRecipeDto,
  CreateSeasonDto,
  MintPremPassDto,
  MintRepDto,
  MintXpDto,
  REPUTATION_TOKEN_ID,
  ShortUrl,
} from './api.dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { LootdropRS } from 'src/reward/reward.entity';

@Controller()
@UseFilters(TypeORMFilter, EthersFilter)
export class ApiController {
  private readonly logger = new Logger(ApiController.name);
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
    private battlePassService: BattlePassService,
    @InjectRedis() private readonly redis: Redis,
    private metadataService: MetadataService,
    private config: ConfigService,
    @Inject('TWITCH_SERVICE') private tcpClient: ClientProxy,
  ) {}

  /*
|========================| GET |========================|
*/

  @Get('battlepass/check/:creatorId')
  async check(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    return {
      exists: true,
      address: contract.address,
    };
  }

  @Get('battlepass/season/:creatorId')
  async getSeasonId(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    return {
      seasonId: (await contract.seasonId()).toNumber(),
    };
  }

  @Get('check/reputation/:creatorId/:userAddress')
  async getReputation(
    @Param('creatorId') creatorId: number,
    @Param('userAddress') userAddress: string,
  ) {
    return await this.battlePassService.getBalance(
      creatorId,
      userAddress,
      REPUTATION_TOKEN_ID,
    );
  }

  @Get('battlepass/reputation/:creatorId')
  async getBattlePass(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = await contract.seasonId();
    const battlePassDB = await this.battlePassService
      .getBattlePass(creatorId)
      .catch((error) => {
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

  /*
|========================| POST |========================|
*/

  @Post('mint/prempass')
  async mintPremiumPass(@Body() mintPremPassDto: MintPremPassDto) {
    const contract = await this.chainService.getBattlePassContract(
      mintPremPassDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.mint(mintPremPassDto.userAddress, seasonId, 1, fee)
    ).wait(1);
    return { success: true };
  }

  @Post('mint/reputation')
  async mintReputation(@Body() mintRepDto: MintRepDto) {
    const contract = await this.chainService.getBattlePassContract(
      mintRepDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.mint(
        mintRepDto.userAddress,
        REPUTATION_TOKEN_ID,
        mintRepDto.amount,
        fee,
      )
    ).wait(1);
    return { success: true };
  }

  @Post('mint/xp') async mintXp(@Body() mintXpDto: MintXpDto) {
    const contract = await this.chainService.getBattlePassContract(
      mintXpDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.giveXp(seasonId, mintXpDto.amount, mintXpDto.userAddress, fee)
    ).wait(1);
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
    const contract = await this.chainService.getBattlePassContract(
      createLootboxDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (await bp.newLootbox(lootboxOption, fee)).wait(1);
    const lootboxId = await bp.lootboxId();
    await this.metadataService
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
        xpToCompleteLevel:
          i != createSeasonDto.levelDetails.length - 1 ? info.xp : 0,
        freeRewardId: info.freeId,
        freeRewardQty: info.freeQty,
        premiumRewardId: info.premId,
        premiumRewardQty: info.premQty,
      });
    }
    const contract = await this.chainService.getBattlePassContract(
      createSeasonDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const fee = await this.chainService.getMaticFeeData();
    await (await bp.newSeason(levelInfo, fee)).wait(1);
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
    for (let i = 0; i < createRecipeDto.outputIngredients.length; i++) {
      const ingredient = createRecipeDto.outputIngredients[i];
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
      .addRecipe(createRecipeDto.creatorId, recipeId)
      .catch((error) => {
        throw new HttpException(error.message, 500);
      });
    return { success: true };
  }

  @Post('create/lootdrop')
  async createLootdrop(@Body() createLootdropDto: CreateLootdropDto) {
    const startPST = new Date(createLootdropDto.start).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
    });
    const endPST = new Date(createLootdropDto.end).toLocaleString('en-US', {
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
    const target = `lootdrop-${createLootdropDto.creatorId}`;
    try {
      await this.redis.set(
        target,
        JSON.stringify(createLootdropDto),
        'EX',
        ttl,
      );
      await this.redis.set(target + '-qty', createLootdropDto.qty, 'EX', ttl);
      await this.redis.del(target + '-list');
    } catch (error) {
      this.logger.error({
        operation: 'Cache Write',
        error,
      });
      throw error;
    }

    // the url service payload
    const urlpayload = {
      creatorId: createLootdropDto.creatorId,
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
      const reward = await this.battlePassService.createRewardObj(
        createLootdropDto.creatorId,
        createLootdropDto.rewardId,
        1,
      );
      this.tcpClient.emit('drop-activated', {
        creatorId: createLootdropDto.creatorId,
        reward: reward,
        threshold: createLootdropDto.threshold,
        requirements: createLootdropDto.requirements,
        start,
        end,
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
