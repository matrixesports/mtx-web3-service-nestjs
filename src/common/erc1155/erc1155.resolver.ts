import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ContractService } from 'src/modules/contract/contract.service';
import {
  ERC1155,
  TokenMetadata,
} from 'src/common/directives/web3.service.directive';
import { MetadataService } from 'src/common/metadata/metadata.service';
import { Erc1155Service } from './erc1155.service';

@Resolver('ERC1155')
export class Erc1155Resolver {
  constructor(private erc1155Service: Erc1155Service) {}

  @ResolveField()
  async metadata(@Parent() parent: ERC1155): Promise<TokenMetadata> {
    if (parent.id == null) return null;
    const ctr = await this.erc1155Service.getCtr(parent.contractDB.address);
    const uri = await ctr.uri(parent.id);
    return await this.erc1155Service.readMetadata(uri);
  }

  @ResolveField()
  async id(@Parent() parent) {
    return parent.id;
  }
}