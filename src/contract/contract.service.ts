import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber, Contract, ethers } from 'ethers';
import { ContractCall, Multicall } from 'pilum';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Contract as ContractDB } from './contract.entity';

export const MATIC_NUMBER_OF_BLOCKS_TO_WAIT = 1;

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractDB)
    private contractRepository: Repository<ContractDB>,
    private configService: ConfigService
  ) {}

  /// will fail if it cannot find
  async findOne(
    where: FindOptionsWhere<ContractDB> | FindOptionsWhere<ContractDB>[]
  ) {
    return await this.contractRepository.findOneByOrFail(where);
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

  /// fallback value is 40 coz minimum is 30
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

  async multicall(calls: ContractCall[], provider: ethers.providers.Provider) {
    const multicall = new Multicall({ provider });
    const { chainId } = await provider.getNetwork();
    let res = await multicall.call(calls, { network: chainId });
    return res.results;
  }
}
