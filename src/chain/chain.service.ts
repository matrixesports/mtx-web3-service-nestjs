import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BattlePass,
  BattlePass__factory,
  BattlePassFactory,
  BattlePassFactory__factory,
  ERC1967Proxy,
  ERC1967Proxy__factory,
} from 'abi/typechain';
import axios from 'axios';
import { BigNumber, Contract, ethers } from 'ethers';
import { ContractCall, Multicall } from 'pilum';

@Injectable()
export class ChainService {
  provider: ethers.providers.Provider;
  chainId: number;
  multicallObj: Multicall;
  private signer: ethers.Signer;
  battlePassFactory: BattlePassFactory;
  craftingProxy: ERC1967Proxy;

  constructor(private configService: ConfigService) {
    let rpc = configService.get('rpc');
    this.provider = new ethers.providers.AlchemyProvider(rpc.name, rpc.apiKey);
    this.chainId = rpc.chainId;
    this.multicallObj = new Multicall({ provider: this.provider });
    this.signer = new ethers.Wallet(
      this.configService.get('PVT_KEY'),
      this.provider,
    );
    let contracts = configService.get('contracts');
    this.battlePassFactory = BattlePassFactory__factory.connect(
      contracts.bpFactory,
      this.provider,
    );
    this.craftingProxy = ERC1967Proxy__factory.connect(
      contracts.craftingProxy,
      this.provider,
    );
  }

  getBPSignerContract(contract: BattlePass) {
    return contract.connect(this.signer);
  }

  getSignerContract(contract: Contract) {
    return (contract.connect(this.signer)) as typeof contract;
  }

  getSigner(): ethers.Signer {
    return this.signer;
  }

  /**
   * will error if not deployed
   * @param creatorId
   * @returns
   */
  async getBattlePassContract(creatorId: number): Promise<BattlePass> {
    let address = await this.battlePassFactory.getBattlePassFromUnderlying(
      creatorId,
    );
    let exists = await this.battlePassFactory.isBattlePassDeployed(address);
    if (!exists) throw new Error('BattlePass not deployed');
    return BattlePass__factory.connect(address, this.provider);
  }

  async multicall(calls: ContractCall[]) {
    let res = await this.multicall.call(calls, { network: this.chainId });
    return res.results;
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
      return {
        maxPriorityFeePerGas: ethers.utils.parseUnits(
          Math.ceil(40) + '',
          'gwei',
        ),
      };
    }
  }
}
