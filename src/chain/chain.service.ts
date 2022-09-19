import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BattlePass,
  BattlePass__factory,
  BattlePassFactory,
  BattlePassFactory__factory,
  ERC1967Proxy,
  ERC1967Proxy__factory,
  Crafting__factory,
} from 'abi/typechain';
import axios from 'axios';
import { BigNumber, Contract, ethers } from 'ethers';
import { FunctionFragment } from 'ethers/lib/utils';
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
    const rpc = configService.get('rpc');
    this.provider = new ethers.providers.AlchemyProvider(rpc.name, rpc.apiKey);
    this.chainId = rpc.chainId;
    this.multicallObj = new Multicall({ provider: this.provider });
    this.signer = new ethers.Wallet(
      this.configService.get('PVT_KEY'),
      this.provider,
    );
    const contracts = configService.get('contracts');
    this.battlePassFactory = BattlePassFactory__factory.connect(
      contracts.bpFactory,
      this.provider,
    );
    this.craftingProxy = ERC1967Proxy__factory.connect(
      contracts.craftingProxy,
      this.provider,
    );
  }

  getSignerContract(contract: Contract) {
    // cast after call
    return contract.connect(this.signer);
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
    const address = await this.battlePassFactory.getBattlePassFromUnderlying(
      creatorId,
    );
    const exists = await this.battlePassFactory.isBattlePassDeployed(address);
    if (!exists) throw new Error('BattlePass not deployed');
    return BattlePass__factory.connect(address, this.provider);
  }

  /**
   * will error if not deployed
   * @param creatorId
   * @returns
   */
  async getBattlePassAddress(creatorId: number) {
    const address = await this.battlePassFactory.getBattlePassFromUnderlying(
      creatorId,
    );
    const exists = await this.battlePassFactory.isBattlePassDeployed(address);
    if (!exists) throw new Error('BattlePass not deployed');
    return address;
  }

  async isBattlePassDeployed(creatorId: number) {
    const address = await this.battlePassFactory.getBattlePassFromUnderlying(
      creatorId,
    );
    return await this.battlePassFactory.isBattlePassDeployed(address);
  }

  async callCrafting(func: any, args: any, userAddress: string) {
    const abi = [Crafting__factory.createInterface().getFunction(func)];
    const iface = new ethers.utils.Interface(abi);
    let encodedCall = iface.encodeFunctionData(func, args);
    if (userAddress) encodedCall += userAddress.substring(2);
    const fee = await this.getMaticFeeData();
    const txData = {
      to: this.craftingProxy.address,
      data: encodedCall,
      ...fee,
    };
    try {
      const tx = await this.signer.sendTransaction(txData);
      return this.signer.provider.waitForTransaction(
        (tx as ethers.providers.TransactionResponse).hash,
        1,
      );
    } catch (error) {
      error.message = 'Crafting Transaction Failed!';
    }
  }

  async metatx(
    abi: FunctionFragment,
    args: any[],
    userAddress: string,
    contractAddress: string,
    fee: {
      maxPriorityFeePerGas: BigNumber;
      maxFeePerGas?: BigNumber;
      gasLimit?: number;
    },
  ) {
    const iface = new ethers.utils.Interface([abi]);
    let encodedCall = iface.encodeFunctionData(abi, args);
    encodedCall += userAddress.substring(2);
    const txData = {
      to: contractAddress,
      data: encodedCall,
      ...fee,
    };
    const tx = await this.signer.sendTransaction(txData);
    return this.provider.waitForTransaction(tx.hash, 1);
  }

  async multicall(calls: ContractCall[]) {
    if (calls.length == 0) return null;
    const res = await this.multicallObj.call(calls, { network: this.chainId });
    if (res.results) return res.results;
    throw new Error('Multi Call Read Failed!');
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
      const maxFeePerGas = ethers.utils.parseUnits(
        Math.ceil(data.fast.maxFee) + '',
        'gwei',
      );
      const maxPriorityFeePerGas = ethers.utils.parseUnits(
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
