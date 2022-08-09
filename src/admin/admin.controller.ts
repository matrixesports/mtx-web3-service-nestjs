import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LootboxOptionStruct } from 'abi/typechain/BattlePass';
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
      const contract = await this.chainService.getBattlePassContract(creatorId);
      if (contract) {
        return {
          success: false,
          description: 'Battle Pass already exists!',
        };
      }
      const fee = await this.chainService.getMaticFeeData();
      const newbp = await this.chainService.battlePassFactory.deployBattlePass(
        creatorId,
        fee,
      );
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
    } catch (e) {
      console.log(e);
      throw e;
    }
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
      return { success: false };
    }
  }

  @Post('newLootbox')
  async newLootbox(@Body() newLootboxDto: NewLootboxDto) {
    try {
      const lootboxOptions: LootboxOptionStruct[] = [];
      const contract = await this.chainService.getBattlePassContract(
        newLootboxDto.creatorId,
      );
      const bp = this.chainService.getBPSignerContract(contract);
    } catch (e) {
      console.log(e);
      throw e;
    }
    // return {
    //   success: true,
    //   lootboxId: 1001,
    // };
  }

  @Post('newSeason')
  async newSeason(@Body() newSeasonDto: NewSeasonDto) {
    try {
      const lootboxOptions: LootboxOptionStruct[] = [];
      const contract = await this.chainService.getBattlePassContract(
        newSeasonDto.creatorId,
      );
      const bp = this.chainService.getBPSignerContract(contract);
    } catch (e) {
      console.log(e);
      throw e;
    }
    // return {
    //   success: true,
    // };
  }
}
