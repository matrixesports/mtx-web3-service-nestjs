import { Body, Controller, Get, Param, Post, Logger, UseFilters, UseInterceptors } from '@nestjs/common';
import { EthersFilter } from 'src/common/filters/ethers.filter';
import { TypeORMFilter } from 'src/common/filters/typeorm.filter';
import { ErrorInterceptor } from 'src/common/interceptors/errorr.interceptor';
import { ContractService } from 'src/contract/contract.service';
import { BattlePassService } from './battlepass.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { MintPremiumPassDto } from './dto/MintPremiumPass.dto';

@Controller('battlepass')
@UseFilters(TypeORMFilter, EthersFilter)
export class BattlePassController {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlePassService,
  ) {}

  @Post('giveXp')
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    let contract = await this.battlePassService.getBattlePassContract(
      giveXpDto.creatorId,
      true
    );
    let seasonId = await contract.seasonId();
    let fee = await this.contractService.getMaticFeeData();
    await contract.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
    return { success: true };
  }

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    let contract = await this.battlePassService.getBattlePassContract(
      mintPremiumPassDto.creatorId,
      true
    );
    let seasonId = await contract.seasonId();
    let fee = await this.contractService.getMaticFeeData();
    await contract.mint(mintPremiumPassDto.userAddress, seasonId, 1, fee);
    return { success: true };
  }

  @Get('metadata/:creatorId')
  async getBattlePassDB(@Param('creatorId') creatorId: number) {
    let contract = await this.battlePassService.getBattlePassContract(
      creatorId
    );
    let seasonId = await contract.seasonId();
    let battlePassDB = await this.battlePassService.getBattlePassDB(
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
