import { Injectable } from '@nestjs/common';
import { Contract } from 'ethers';

import { ContractService } from 'src/contract/contract.service';
import { MetadataService } from 'src/metadata/metadata.service';

@Injectable()
export class Erc1155Service {
  constructor(
    private metadataService: MetadataService,
    private contractService: ContractService,
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
