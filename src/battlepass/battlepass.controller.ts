import { Body, Controller, Post } from '@nestjs/common';
import { ContractService } from 'src/contract/contract.service';
import { GiveXpDto } from './dto/GiveXp.dto';
import { MintPremiumPassDto } from './dto/MintPremiumPass.dto';
import { UpdateRedeemableStatusDto } from './dto/UpdateRedeemableStatus.dto';

@Controller('battlepass')
export class BattlepassController {
  constructor(private contractService: ContractService) {}
  @Post('giveXp')
  async giveXp(@Body() giveXpDto: GiveXpDto) {
    let contractDb = await this.contractService.findForCreator(
      giveXpDto.creatorId,
      'BattlePass'
    );
    if (contractDb.length == 0) return { success: false };
    let contract = this.contractService.getSignerContract(contractDb[0]);
    let seasonId = await contract.seasonId();
    try {
      let fee = this.contractService.getMaticFeeData();
      await contract.giveXp(seasonId, giveXpDto.xp, giveXpDto.userAddress, fee);
    } catch (e) {
      return { success: false };
    }
    return { success: true };
  }

  @Post('updateStatus')
  async updateStatus(
    @Body() updateRedeemableStatusDto: UpdateRedeemableStatusDto
  ) {
    let contractDb = await this.contractService.findByAddress(
      updateRedeemableStatusDto.address
    );
    if (contractDb.length == 0) return { success: false };
    let contract = this.contractService.getSignerContract(contractDb[0]);
    try {
      let fee = this.contractService.getMaticFeeData();
      let ticketId = updateRedeemableStatusDto.ticketId.replace('-', '');
      if (updateRedeemableStatusDto.approved) {
        await contract.updateStatus(ticketId, 0, fee);
      } else {
        await contract.updateStatus(ticketId, 2, fee);
      }
    } catch (e) {
      return { success: false };
    }
    return { success: true };
  }

  @Post('mint')
  async mintPremiumPass(@Body() mintPremiumPassDto: MintPremiumPassDto) {
    let contractDb = await this.contractService.findForCreator(
      mintPremiumPassDto.creatorId,
      'BattlePass'
    );
    if (contractDb.length == 0) return { success: false };
    let contract = this.contractService.getSignerContract(contractDb[0]);
    let seasonId = await contract.seasonId();

    try {
      let fee = this.contractService.getMaticFeeData();
      await contract.mint(mintPremiumPassDto.to, seasonId, 1);
    } catch (e) {
      return { success: false };
    }
    return { success: true };
  }
}
