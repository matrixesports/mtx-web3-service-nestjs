import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChainService } from 'src/chain/chain.service';
import { BattlePassService } from './battle-pass.service';
import { MintPremiumPassDto } from './dto/MintPremiumPass.dto';

@Controller('battlepass')
export class BattlePassController {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
  ) {}

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    try {
      const contract = await this.chainService.getBattlePassContract(
        mintPremiumPassDto.creatorId,
      );
      const bp = this.chainService.getBPSignerContract(contract);
      const seasonId = await bp.seasonId();
      const fee = await this.chainService.getMaticFeeData();
      await bp.mint(mintPremiumPassDto.userAddress, seasonId, 1, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

  @Get('metadata/:creatorId')
  async getBattlePassDB(@Param('creatorId') creatorId: number) {
    const contract = await this.chainService.getBattlePassContract(creatorId);
    const seasonId = await contract.seasonId();
    const battlePassDB = await this.battlePassService.getBattlePassDB(
      creatorId,
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
