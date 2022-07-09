import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Contract as ContractDB, CtrType } from './contract.entity';
import { BigNumber, Contract, ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

export const MATIC_NUMBER_OF_BLOCKS_TO_WAIT = 1;

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractDB)
    private contractRepository: Repository<ContractDB>,
    private configService: ConfigService
  ) {}

  // will return empty array if it cant find matching address
  async findByAddress(address: string): Promise<ContractDB[]> {
    return this.contractRepository.find({ where: { address: address } });
  }

  // will return empty array if it cant find matching address
  async findForCreator(
    creatorId: number,
    ctrType: CtrType
  ): Promise<ContractDB[]> {
    return this.contractRepository.find({
      where: { creator_id: creatorId, ctr_type: ctrType },
    });
  }

  async findByType(ctrType: CtrType): Promise<ContractDB[]> {
    return this.contractRepository.find({
      where: { ctr_type: ctrType },
    });
  }

  getProvider(network: string): ethers.providers.Provider {
    return new ethers.providers.AlchemyProvider(
      network,
      this.configService.get('ALCHEMY_API_KEY')
    );
  }

  getProviderContract(contractDB: ContractDB): Contract {
    return new ethers.Contract(
      contractDB.address,
      contractDB.abi,
      this.getProvider(contractDB.network)
    );
  }

  getSigner(network: string): ethers.Signer {
    return new ethers.Wallet(
      this.configService.get('PVT_KEY'),
      this.getProvider(network)
    );
  }

  getSignerContract(contractDB: ContractDB): Contract {
    return new ethers.Contract(
      contractDB.address,
      contractDB.abi,
      this.getSigner(contractDB.network)
    );
  }

  /**
   *
   * @returns fallback value is 40 coz minimum is 30
   */
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
        'gwei'
      );
      let maxPriorityFeePerGas = ethers.utils.parseUnits(
        Math.ceil(data.fast.maxPriorityFee) + '',
        'gwei'
      );

      return {
        maxPriorityFeePerGas,
        maxFeePerGas,
      };
    } catch (e) {
      return {
        maxPriorityFeePerGas: ethers.utils.parseUnits(
          Math.ceil(40) + '',
          'gwei'
        ),
      };
    }
  }
}
