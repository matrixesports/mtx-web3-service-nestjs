import { Body, Controller, Get, Param, Post, Logger, UseFilters } from '@nestjs/common';
import { ethers } from 'ethers';
import { TypeORMFilter } from 'src/common/filters/typeorm.filter';
import { ContractService } from 'src/contract/contract.service';
import { BattlePassService } from './battlepass.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { MintPremiumPassDto } from './dto/MintPremiumPass.dto';

@Controller('battlepass')
export class BattlePassController {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlePassService,
  ) {}

  @Post('giveXp')
  @UseFilters(TypeORMFilter)
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    let contract = await this.battlePassService.getPassContract(
      giveXpDto.creatorId,
      true
    );
    let seasonId = await contract.seasonId();
    let fee = this.contractService.getMaticFeeData();
    await contract.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
    return { success: true };
  }

  @Post('mint')
  @UseFilters(TypeORMFilter)
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    const logger = new Logger(this.giveXp.name);
    try {
      let contract = await this.battlePassService.getPassContract(
        mintPremiumPassDto.creatorId,
        true
      );
      let seasonId = await contract.seasonId();
      let user = ethers.utils.getAddress(mintPremiumPassDto.userAddress);
      let fee = await this.contractService.getMaticFeeData();
      await contract.mint(user, seasonId, 1, fee);
      return { success: true };
    } catch (e) {
      logger.warn(e);
      return { success: false };
    }
  }

  @Get('metadata/:creatorId')
  @UseFilters(TypeORMFilter)
  async getBattlePassMetadata(@Param('creatorId') creatorId: number) {
    let contract = await this.battlePassService.getPassContract(creatorId);
    let seasonId = await contract.seasonId();
    let battlePassDB = await this.battlePassService.getBattlePassMetadata(
      contract.address
    );
    return {
      price: battlePassDB.price,
      currency: battlePassDB.currency,
      name: battlePassDB.name,
      description: battlePassDB.description,
      seasonId: seasonId.toNumber(),
      address: contract.address,
    };
  }
}
