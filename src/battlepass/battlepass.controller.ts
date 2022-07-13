import { Body, Controller, Post } from '@nestjs/common';
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
      let contract = await this.battlePassService.getPassContract(
        giveXpDto.creatorId,
        true
      );
      let seasonId = await contract.seasonId();
      let fee = this.contractService.getMaticFeeData();
      await contract.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    try {
      let contract = await this.battlePassService.getPassContract(
        mintPremiumPassDto.creatorId,
        true
      );
      let seasonId = await contract.seasonId();
      let fee = this.contractService.getMaticFeeData();
      await contract.mint(mintPremiumPassDto.to, seasonId, 1, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
