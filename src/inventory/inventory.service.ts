import {
  AlchemyWeb3,
  BaseNft,
  createAlchemyWeb3,
  GetNftsResponseWithoutMetadata,
} from '@alch/alchemy-web3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class InventoryService {
  web3: AlchemyWeb3;
  constructor(private configService: ConfigService) {
    this.web3 = createAlchemyWeb3(this.configService.get('POLYGON').rpc);
  }

  async getNFTSOwnedForUser(
    token_contracts: Array<string>,
    user: string
  ): Promise<BaseNft[]> {
    let res: GetNftsResponseWithoutMetadata;
    try {
      res = await this.web3.alchemy.getNfts({
        owner: user,
        contractAddresses: token_contracts,
        withMetadata: false,
      });
    } catch (e) {
      return [];
    }
    for (let x = 0; x < res.ownedNfts.length; x++) {
      res.ownedNfts[x].contract.address = ethers.utils.getAddress(
        res.ownedNfts[x].contract.address
      );
    }
    return res.ownedNfts;
  }
}
