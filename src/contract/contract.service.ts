import {
  AlchemyWeb3,
  BaseNft,
  createAlchemyWeb3,
  GetNftsResponseWithoutMetadata,
} from '@alch/alchemy-web3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { Repository } from 'typeorm';
import { Contract, CtrType } from './contract.entity';

@Injectable()
export class ContractService {
  web3: AlchemyWeb3;
  NUMBER_OF_BLOCKS_TO_WAIT = 3;

  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    private configService: ConfigService
  ) {
    this.web3 = createAlchemyWeb3(
      `https://polygon-mainnet.g.alchemy.com/v2/${this.configService.get(
        'ALCHEMY_API_KEY'
      )}`
    );
  }

  async find(by: {
    [key: string]: string | number | CtrType;
  }): Promise<Contract[]> {
    return await this.contractRepo.findBy(by);
  }

  async findByAddress(address): Promise<Contract> {
    const res = await this.find({ address: ethers.utils.getAddress(address) });
    return res[0];
  }

  getProvider(network: string): ethers.providers.Provider {
    return new ethers.providers.AlchemyProvider(
      network,
      this.configService.get('ALCHEMY_API_KEY')
    );
  }

  getSigner(network: string): ethers.Signer {
    const provider = this.getProvider(network);
    return new ethers.Wallet(this.configService.get('PVT_KEY'), provider);
  }

  async create(contract: Contract) {
    const provider = await this.getProvider(contract.network);
    return new ethers.Contract(contract.address, contract.abi, provider);
  }

  async createWSigner(contract: Contract): Promise<ethers.Contract> {
    const provider = this.getProvider(contract.network);
    const signer = new ethers.Wallet(
      this.configService.get('PVT_KEY'),
      provider
    );
    return new ethers.Contract(contract.address, contract.abi, signer);
  }

  //   async createWOracleSigner(): Promise<ethers.Contract> {
  //     let contract = await this.findOne(address);
  //     let provider = this.getProvider(contract.network);
  //     let signer = new ethers.Wallet(
  //       this.configService.get('ORACLE_PVT_KEY'),
  //       provider,
  //     );
  //     return new ethers.Contract(address, contract.abi, signer);
  //   }

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
      console.log(e);
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
