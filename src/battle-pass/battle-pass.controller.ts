import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { BattlePass } from 'abi/typechain';
import { ChainService } from 'src/chain/chain.service';
import { EthersFilter, TypeORMFilter } from 'src/common/filters';
import { BattlePassService } from './battle-pass.service';
import { GiveXpDto, MintPremiumPassDto } from './battle-pass.dto';

@Controller('battlepass')
@UseFilters(TypeORMFilter, EthersFilter)
export class BattlePassController {
  constructor(
    private chainService: ChainService,
    private battlePassService: BattlePassService,
  ) {}

  /*
|========================| GET |========================|
*/

  @Get('metadata/:creatorId')
  async getBattlePassDB(@Param('creatorId') creatorId: number) {
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

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    const contract = await this.chainService.getBattlePassContract(
      mintPremiumPassDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.mint(mintPremiumPassDto.userAddress, seasonId, 1, fee)
    ).wait(1);
    return { success: true };
  }

  @Post('giveXp') async giveXp(@Body() giveXpDto: GiveXpDto) {
    const contract = await this.chainService.getBattlePassContract(
      giveXpDto.creatorId,
    );
    const bp = this.chainService.getSignerContract(contract) as BattlePass;
    const seasonId = await bp.seasonId();
    const fee = await this.chainService.getMaticFeeData();
    await (
      await bp.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee)
    ).wait(1);
    return { success: true };
  }
}
