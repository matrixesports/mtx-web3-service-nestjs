import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChainService } from 'src/chain/chain.service';
import { BattlePassService } from './battle-pass.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { MintPremiumPassDto } from './dto/MintPremiumPass.dto';

@Controller('battlepass')
export class BattlePassController {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
  ) {}

  @Post('giveXp')
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    try {
      let contract = await this.chainService.getBattlePassContract(
        giveXpDto.creatorId,
      );
      let bp = await this.chainService.getSignerContract(contract);
      let seasonId = await bp.seasonId();
      let fee = await this.chainService.getMaticFeeData();
      await bp.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    try {
      let contract = await this.chainService.getBattlePassContract(
        mintPremiumPassDto.creatorId,
      );
      let bp = await this.chainService.getSignerContract(contract);
      let seasonId = await bp.seasonId();
      let fee = await this.chainService.getMaticFeeData();
      await bp.mint(mintPremiumPassDto.userAddress, seasonId, 1, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Get('metadata/:creatorId')
  async getBattlePassDB(@Param('creatorId') creatorId: number) {
    let contract = await this.chainService.getBattlePassContract(creatorId);
    let seasonId = await contract.seasonId();
    let battlePassDB = await this.battlePassService.getBattlePassDB(creatorId);
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
