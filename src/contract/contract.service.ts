import {
  AlchemyWeb3,
  BaseNft,
  createAlchemyWeb3,
  GetNftsResponseWithoutMetadata,
} from '@alch/alchemy-web3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber, ethers } from 'ethers';
import { DataSource, Repository } from 'typeorm';
import { Contract, CtrType } from './contract.entity';

@Injectable()
export class ContractService {
  web3: AlchemyWeb3;
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.web3 = createAlchemyWeb3(
      `https://polygon-mainnet.g.alchemy.com/v2/${this.configService.get(
        'ALCHEMY_API_KEY',
      )}`,
    );
  }

  async findOne(address: string): Promise<Contract> {
    return await this.contractRepo.findOneByOrFail({
      address: address,
    });
  }

  async findOneByCreatorAndType(
    creatorId: number,
    ctrType: CtrType,
  ): Promise<Contract> {
    return await this.contractRepo.findOneByOrFail({
      creator_id: creatorId,
      ctr_type: ctrType,
    });
  }

  async addToDb(contract: Contract) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(contract);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
      throw new Error('');
    }
  }

  async create(contract: Contract) {
    let provider = await this.getProvider(contract.network);
    return new ethers.Contract(contract.address, contract.abi, provider);
  }

  async createWProvider(address: string): Promise<ethers.Contract> {
    let contract = await this.findOne(address);
    let provider = this.getProvider(contract.network);
    return new ethers.Contract(address, contract.abi, provider);
  }

  async createWSigner(address: string): Promise<ethers.Contract> {
    let contract = await this.findOne(address);
    let provider = this.getProvider(contract.network);
    let signer = new ethers.Wallet(this.configService.get('PVT_KEY'), provider);
    return new ethers.Contract(address, contract.abi, signer);
  }

  async createWOracleSigner(address: string): Promise<ethers.Contract> {
    let contract = await this.findOne(address);
    let provider = this.getProvider(contract.network);
    let signer = new ethers.Wallet(
      this.configService.get('ORACLE_PVT_KEY'),
      provider,
    );
    return new ethers.Contract(address, contract.abi, signer);
  }

  getProvider(network: string): ethers.providers.Provider {
    return new ethers.providers.AlchemyProvider(
      network,
      this.configService.get('ALCHEMY_API_KEY'),
    );
  }
  async getMaticFeeData(): Promise<{
    maxPriorityFeePerGas: BigNumber;
    maxFeePerGas?: BigNumber;
  } | null> {
    try {
      const { data } = await axios({
        method: 'get',
        url: 'https://gasstation-mainnet.matic.network/v2',
      });
      let maxFeePerGas = ethers.utils.parseUnits(
        Math.ceil(data.fast.maxFee) + '',
        'gwei',
      );
      let maxPriorityFeePerGas = ethers.utils.parseUnits(
        Math.ceil(data.fast.maxPriorityFee) + '',
        'gwei',
      );

      return {
        maxPriorityFeePerGas,
        maxFeePerGas,
      };
    } catch (e) {
      console.log(e);
      return {
        maxPriorityFeePerGas: ethers.utils.parseUnits(
          Math.ceil(40) + '',
          'gwei',
        ),
      };
    }
  }
  async getNFTSOwnedForUser(
    token_contracts: Array<string>,
    user: string,
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
        res.ownedNfts[x].contract.address,
      );
    }
    return res.ownedNfts;
  }
}
