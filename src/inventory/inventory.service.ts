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
    this.web3 = createAlchemyWeb3(this.configService.get('POLYGON').rpc);
  }

  async getNFTSOwnedForUser(
    token_contracts: Array<string>,
    user: string,
    pageKey?: string
  ): Promise<BaseNft[]> {
    let res: GetNftsResponseWithoutMetadata;
    if (pageKey == null) {
      res = await this.web3.alchemy.getNfts({
        owner: user,
        contractAddresses: token_contracts,
        withMetadata: false,
      });
    } else {
      res = await this.web3.alchemy.getNfts({
        owner: user,
        contractAddresses: token_contracts,
        withMetadata: false,
        pageKey: pageKey,
      });
    }
    if (res.pageKey == null) return res.ownedNfts;
    let owned: BaseNft[];
    owned.push(
      ...res.ownedNfts,
      ...(await this.getNFTSOwnedForUser(token_contracts, user, res.pageKey))
    );
    // for (let x = 0; x < owned.length; x++) {
    //   owned[x].contract.address = ethers.utils.getAddress(
    //     owned[x].contract.address
    //   );
    // }

    return owned;
  }
}
