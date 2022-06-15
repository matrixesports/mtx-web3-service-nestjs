import { Body, Controller, Get, Post } from '@nestjs/common';
import { Contract } from './contract.entity';
import { ContractService } from './contract.service';
import { AddContractDto } from './dto/add-contract.dto';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post('add')
  async add(@Body() addContractDto: AddContractDto) {
    let ctr = new Contract();
    let abi = import(
      `../../out/${addContractDto.name}.sol/${addContractDto.name}.json`
    );
    ctr.abi = abi;
    ctr.address = addContractDto.address;
    ctr.creator_id = addContractDto.creator_id;
    ctr.ctr_type = addContractDto.ctr_type;
    ctr.name = addContractDto.name;
    ctr.network = addContractDto.network;
    await this.contractService.addToDb(ctr);
    return {
      success: true,
    };
  }
}
