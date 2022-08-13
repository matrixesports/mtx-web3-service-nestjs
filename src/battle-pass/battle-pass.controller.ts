import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BattlePass } from 'abi/typechain';
import { ChainService } from 'src/chain/chain.service';
import { BattlePassService } from './battle-pass.service';
import { GiveXpDto } from './dto/giveXp.dto';
import { MintPremiumPassDto } from './dto/mintPremiumPass.dto';

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
      const bp = this.chainService.getSignerContract(contract) as BattlePass;
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

  @Post('giveXp') async giveXp(@Body() giveXpDto: GiveXpDto) {
    try {
      const contract = await this.chainService.getBattlePassContract(
        giveXpDto.creatorId,
      );
      const seasonId = await contract.seasonId();
      const fee = await this.chainService.getMaticFeeData();
      await contract.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
