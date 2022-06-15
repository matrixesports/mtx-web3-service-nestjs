import { Body, Controller, Post } from '@nestjs/common';
import { ContractService } from 'src/contract/contract.service';
import { NewPassDto } from './dto/new-pass.dto';
import { PassService } from './pass.service';

@Controller('pass')
export class PassController {
  constructor(
    private passService: PassService,
    private contractService: ContractService,
  ) {}

  @Post('new')
  async newPass(@Body() newPassDto: NewPassDto) {
    let contract = this.contractService.findOneBy({
      address: newPassDto.address,
      creator_id: newPassDto.creator_id,
    });
  }
}
