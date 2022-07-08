import axios from 'axios';
import * as dotenv from 'dotenv';
import { BigNumber, Contract, ethers } from 'ethers';

dotenv.config();
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PVT_KEY = process.env.PVT_KEY;
export const MATIC_NUMBER_OF_BLOCKS_TO_WAIT = 1;

export function getProvider(network: string): ethers.providers.Provider {
  return new ethers.providers.AlchemyProvider(network, ALCHEMY_API_KEY);
}

export function getSigner(network: string): ethers.Signer {
  return new ethers.Wallet(PVT_KEY!, getProvider(network));
}

export async function getProviderContract(
  address: string,
  abi: string,
  network: string
): Promise<Contract> {
  return new ethers.Contract(address, abi, await getProvider(network));
}

export async function getSignerContract(
  address: string,
  abi: string,
  network: string
): Promise<Contract> {
  return new ethers.Contract(address, abi, await getSigner(network));
}

// export async function getContractFromAddress(
//   address: string,
//   useSigner: boolean,
//   oracle: boolean
// ): Promise<Contract | null> {
//   let info = await getContractInfo(address);
//   if (info == null) {
//     return null;
//   }

//   let signer;
//   if (useSigner) {
//     if (oracle) {
//       signer = await getOracleSigner(info.network);
//     } else {
//       signer = await getSigner(info.network);
//     }
//   } else {
//     signer = await getProvider(info.network);
//   }
//   return new ethers.Contract(address, info.abi, signer);
// }

/**
 *
 * @returns fallback value is 40 coz minimum is 30
 */
export async function getMaticFeeData(): Promise<{
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
    console.log(e);
    return {
      maxPriorityFeePerGas: ethers.utils.parseUnits(Math.ceil(40) + '', 'gwei'),
    };
  }
}
