import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContractService } from 'src/contract/contract.service';
import { BattlePassService } from './battlepass.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { MintPremiumPassDto } from './dto/MintPremiumPass.dto';

@Controller('battlepass')
export class BattlePassController {
  constructor(
    private contractService: ContractService,
    private battlePassService: BattlePassService
  ) {}

  @Post('giveXp')
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    try {
      const contract = await this.battlePassService.getBattlePassContract(
        giveXpDto.creatorId,
        true
      );
      const seasonId = await contract.seasonId();
      const fee = await this.contractService.getMaticFeeData();
      await contract.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    try {
      const contract = await this.battlePassService.getBattlePassContract(
        mintPremiumPassDto.creatorId,
        true
      );
      const seasonId = await contract.seasonId();
      const fee = await this.contractService.getMaticFeeData();
      await contract.mint(mintPremiumPassDto.userAddress, seasonId, 1, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Get('metadata/:creatorId')
  async getBattlePassDB(@Param('creatorId') creatorId: number) {
    const contract = await this.battlePassService.getBattlePassContract(
      creatorId
    );
    const seasonId = await contract.seasonId();
    const battlePassDB = await this.battlePassService.getBattlePassDB(
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
