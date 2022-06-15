import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Contract } from './contract.entity';
import { ContractService } from './contract.service';
import { AddContractDto } from './dto/add-contract.dto';
import { DeployContractDto } from './dto/deploy-contract.dto';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  //TODO: catch diff errors and report diff error message
  //defaults to returning the first one in db if no param present
  @Get()
  async getContract(@Query() params): Promise<{
    success: boolean;
    contract?: Contract;
    message?: string;
  }> {
    try {
      let contract = await this.contractService.findOneBy(params);
      return {
        contract,
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: 'Invalid params',
      };
    }
  }

  @Post('deploy')
  async deploy(@Body() deployContractDto: DeployContractDto): Promise<{
    success: boolean;
    address?: string;
    message?: string;
  }> {
    try {
      let address = await this.contractService.deploy(deployContractDto);
      let addContractDto = new AddContractDto();
      addContractDto.address = address;
      addContractDto.creator_id = deployContractDto.creator_id;
      addContractDto.ctr_type = deployContractDto.ctr_type;
      addContractDto.name = deployContractDto.name;
      addContractDto.network = deployContractDto.network;
      await this.contractService.add(addContractDto);
      return {
        success: true,
        address,
      };
    } catch (e) {
      return {
        success: false,
        message: `invalid params, ${e.message}`,
      };
    }
  }
}
