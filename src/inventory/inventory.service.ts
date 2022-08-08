import {
  AlchemyWeb3,
  BaseNft,
  createAlchemyWeb3,
  GetNftsResponseWithoutMetadata,
} from '@alch/alchemy-web3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InventoryService {
  web3: AlchemyWeb3;
  constructor(private configService: ConfigService) {
    this.web3 = createAlchemyWeb3(this.configService.get('rpc').url);
  }

  /**
   * paginates, 100 per page, max 20 address per call
   * highly unlikely items per contract go above a 100
   * @param token_contracts list of token contracts to query
   * @param user
   * @returns
   */
  async getNFTSOwnedForUser(
    token_contracts: Array<string>,
    user: string,
  ): Promise<BaseNft[]> {
    let res: GetNftsResponseWithoutMetadata = await this.web3.alchemy.getNfts({
      owner: user,
      contractAddresses: token_contracts,
      withMetadata: false,
    });
    return res.ownedNfts;
  }
}
