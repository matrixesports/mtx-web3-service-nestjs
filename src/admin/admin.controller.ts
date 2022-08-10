import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BattlePassFactory } from 'abi/typechain';
import { LevelInfoStruct, LootboxOptionStruct } from 'abi/typechain/BattlePass';
import { ChainService } from 'src/chain/chain.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { NewLootboxDto } from './dto/NewLootboxDto';
import { NewSeasonDto } from './dto/NewSeasonDto';

@Controller('admin')
export class AdminController {
  constructor(private chainService: ChainService) {}
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
      const bp = this.chainService.getBPSignerContract(contract);
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
    let lootboxId;
    try {
      const jointprob = 0;
      const maxprob = 100;
      const lootboxOption: LootboxOptionStruct[] = [];
      for (let i = 0; i < newLootboxDto.lootboxInfo.length; i++) {
        const option = newLootboxDto.lootboxInfo[i];
        if (option.ids.length != option.ids.length) {
          return {
            success: false,
            description: 'IDs != QTYs',
          };
        }
        if (jointprob + option.rarity > maxprob) {
          return {
            success: false,
            description: 'Max Probability Exceeded',
          };
        }
        lootboxOption.push({
          ids: option.ids,
          qtys: option.qtys,
          rarityRange: [jointprob, jointprob + option.rarity],
        });
      }
      const contract = await this.chainService.getBattlePassContract(
        newLootboxDto.creatorId,
      );
      const bp = this.chainService.getBPSignerContract(contract);
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
      console.log(levelInfo);
      const contract = await this.chainService.getBattlePassContract(
        newSeasonDto.creatorId,
      );
      const bp = this.chainService.getBPSignerContract(contract);
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
}
