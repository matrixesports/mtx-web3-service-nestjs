import {
  AlchemyWeb3,
  BaseNft,
  createAlchemyWeb3,
  GetNftsResponseWithoutMetadata,
} from '@alch/alchemy-web3';
import { Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber, ContractFactory, ethers } from 'ethers';
import { DataSource, Repository } from 'typeorm';
import { Contract, CtrType } from './contract.entity';
import { AddContractDto } from './dto/add-contract.dto';
import { DeployContractDto } from './dto/deploy-contract.dto';

@Injectable()
export class ContractService {
  web3: AlchemyWeb3;
  NUMBER_OF_BLOCKS_TO_WAIT = 3;

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

  /*//////////////////////////////////////////////////////////////////////
                                DB
    //////////////////////////////////////////////////////////////////////*/

  // TODO: does this fail nicely?
  async findOneBy(by: {
    [key: string]: string | number | CtrType;
  }): Promise<Contract> {
    return await this.contractRepo.findOneByOrFail(by);
  }

  //TODO: test with dto
  //dont allow multiple ctrs for creator
  async add(addContractDto: AddContractDto) {
    let ctr = new Contract();
    ctr.address = addContractDto.address;
    ctr.creator_id = addContractDto.creator_id;
    ctr.ctr_type = addContractDto.ctr_type;
    ctr.name = addContractDto.name;
    ctr.network = addContractDto.network;

    let compiledCtr = await this.getCompiledCtr(addContractDto.name);
    ctr.abi = compiledCtr.abi;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(ctr);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new Error('Could not add to DB');
    }
    await queryRunner.release();
  }

  /*//////////////////////////////////////////////////////////////////////
                                Ethers
  //////////////////////////////////////////////////////////////////////*/

  async deploy(deployContractDto: DeployContractDto): Promise<string> {
    let factory = await this.getFactory(deployContractDto);
    let fee;
    if (deployContractDto.network == 'matic') {
      fee = await this.getMaticFeeData();
    }
    let ctr: ethers.Contract;
    try {
      if (deployContractDto.args == undefined) {
        ctr = await factory.deploy(fee);
      } else {
        ctr = await factory.deploy(...deployContractDto.args, fee);
      }

      await this.waitForTx(
        ctr.deployTransaction.hash,
        deployContractDto.network,
      );
    } catch (e) {
      throw new Error(`Cannot deploy ctr ${deployContractDto} ${e}`);
    }
    console.log('DEPLOYED:', deployContractDto);
    return ctr.address;
  }

  async create(contract: Contract) {
    let provider = await this.getProvider(contract.network);
    return new ethers.Contract(contract.address, contract.abi, provider);
  }

  //   async createWProvider(address: string): Promise<ethers.Contract> {
  //     let contract = await this.findOne(address);
  //     let provider = this.getProvider(contract.network);
  //     return new ethers.Contract(address, contract.abi, provider);
  //   }

  //   async createWSigner(address: string): Promise<ethers.Contract> {
  //     let contract = await this.findOne(address);
  //     let provider = this.getProvider(contract.network);
  //     let signer = new ethers.Wallet(this.configService.get('PVT_KEY'), provider);
  //     return new ethers.Contract(address, contract.abi, signer);
  //   }

  //   async createWOracleSigner(address: string): Promise<ethers.Contract> {
  //     let contract = await this.findOne(address);
  //     let provider = this.getProvider(contract.network);
  //     let signer = new ethers.Wallet(
  //       this.configService.get('ORACLE_PVT_KEY'),
  //       provider,
  //     );
  //     return new ethers.Contract(address, contract.abi, signer);
  //   }

  getProvider(network: string): ethers.providers.Provider {
    return new ethers.providers.AlchemyProvider(
      network,
      this.configService.get('ALCHEMY_API_KEY'),
    );
  }

  getSigner(network: string): ethers.Signer {
    let provider = this.getProvider(network);
    return new ethers.Wallet(this.configService.get('PVT_KEY'), provider);
  }

  /*//////////////////////////////////////////////////////////////////////
                                ALCHEMY
  //////////////////////////////////////////////////////////////////////*/

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

  /*//////////////////////////////////////////////////////////////////////
                                UTILS
  //////////////////////////////////////////////////////////////////////*/

  //will throw error
  async getFactory(
    deployContractDto: DeployContractDto,
  ): Promise<ethers.ContractFactory> {
    let signer = this.getSigner(deployContractDto.network);
    let compiledCtr = await this.getCompiledCtr(deployContractDto.name);
    try {
      if (
        deployContractDto.ctr_type == 'Lootbox' ||
        deployContractDto.ctr_type == 'Pass' ||
        deployContractDto.ctr_type == 'Workshop'
      ) {
        let distributor: Contract = await this.findOneBy({
          ctr_type: 'Distributor',
          network: deployContractDto.network,
        });
        let linkedBytecode = this.linkLibraries(
          compiledCtr.bytecode.object,
          compiledCtr.bytecode.linkReferences,
          distributor.address,
        );
        return new ContractFactory(compiledCtr.abi, linkedBytecode, signer);
      } else {
        return new ContractFactory(
          compiledCtr.abi,
          compiledCtr.bytecode,
          signer,
        );
      }
    } catch (e) {
      throw new Error(
        `cannot get compiled contract for ${deployContractDto.name}`,
      );
    }
  }

  linkLibraries(bytecode: any, linkReferences: any, libAddy: any): string {
    Object.keys(linkReferences).forEach((fileName) => {
      Object.keys(linkReferences[fileName]).forEach((contractName) => {
        const address = libAddy.toLowerCase().slice(2);
        linkReferences[fileName][contractName].forEach(
          ({ start: byteStart, length: byteLength }: any) => {
            const start = 2 + byteStart * 2;
            const length = byteLength * 2;
            bytecode = bytecode
              .slice(0, start)
              .concat(address)
              .concat(bytecode.slice(start + length, bytecode.length));
          },
        );
      });
    });
    return bytecode;
  }

  async waitForTx(hash: string, network: string) {
    let provider = this.getProvider(network);
    await provider.waitForTransaction(hash, this.NUMBER_OF_BLOCKS_TO_WAIT);
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

  async getCompiledCtr(name: string) {
    try {
      let res = await import(process.cwd() + `/out/${name}.sol/${name}.json`);
      return res;
    } catch (e) {
      throw new Error(`Cannot find compiled contract ${name}`);
    }
  }
}
