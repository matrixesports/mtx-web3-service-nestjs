import { Injectable } from '@nestjs/common';
import { Contract } from 'ethers';

import { ContractService } from 'src/modules/contract/contract.service';
import { MetadataService } from 'src/common/metadata/metadata.service';

@Injectable()
export class Erc1155Service {
  constructor(
    private metadataService: MetadataService,
    private contractService: ContractService
  ) {}

  async getCtr(address: string): Promise<Contract> {
    const fullContractDB = await this.contractService.find({
      address: address,
    });
    return await this.contractService.create(fullContractDB[0]);
  }

  async readMetadata(uri: string) {
    return await this.metadataService.readFromIPFS(uri);
  }
}
