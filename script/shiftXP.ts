import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { BigNumber, ethers } from 'ethers';
import { BattlePass__factory } from './../abi/typechain/';
import * as dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

/*
 * Use to transfer xp from previous season to the current one
 */

const rpcName = process.env.CHAIN_NAME;
const rpcApiKey = process.env.ALCHEMY_API_KEY;
const ptvKey = process.env.PVT_KEY;
const provider = new ethers.providers.AlchemyProvider(rpcName, rpcApiKey);
const signer = new ethers.Wallet(ptvKey, provider);

async function getTx(path: string, date: Date): Promise<string[]> {
  const txs = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', (row) => {
        if (row[15] === 'Give Xp' && new Date(row[3]) < date) {
          txs.push(row[0].slice());
        }
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        resolve(txs);
      });
  });
}

type userXp = {
  userAddress: string;
  xp: number;
};
async function getXp(txs: string[], seasonId: number) {
  const xps: userXp[] = [];
  const iface = BattlePass__factory.createInterface();
  const fragment = iface.getFunction('giveXp');
  for (let i = 0; i < txs.length; i++) {
    const tx = await provider.getTransaction(txs[i]);
    const receipt = iface.decodeFunctionData(fragment, tx.data);
    if (receipt[0].toNumber() != seasonId) continue;
    const index = xps.findIndex((entry) => entry.userAddress === receipt[2]);
    if (index == -1) {
      xps.push({ userAddress: receipt[2], xp: receipt[1].toNumber() });
    } else {
      xps[index].xp += receipt[1].toNumber();
    }
  }
  return xps;
}

async function giveXp(address: string, xps: userXp[]) {
  let contract = BattlePass__factory.connect(address, provider);
  const seasonId = await contract.seasonId();
  contract = contract.connect(signer);
  for (let i = 71; i < xps.length; i++) {
    const fee = await getMaticFeeData();
    await (
      await contract.giveXp(seasonId, xps[i].xp, xps[i].userAddress, fee)
    ).wait(1);
    console.log(i + ' is done!'); // restart from i if error
  }
}

/// fallback value is 40 coz minimum is 30
async function getMaticFeeData(): Promise<{
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
      maxPriorityFeePerGas: ethers.utils.parseUnits(Math.ceil(40) + '', 'gwei'),
    };
  }
}

async function main() {
  // format: '2022-09-10 17:11:07'
  const date = new Date('2022-09-10 10:00:00');
  // get csv with txs from polygonscan
  const txs = await getTx(path.join(process.cwd() + '/script/tx.csv'), date);
  const seasonId = 1;
  const xps = await getXp(txs, seasonId);
  const bpAddress = '0xEfE4017302Cb991FaB6D56c9F35628AFB75445b5';
  // TODO: save xps on disck in case of error
  await giveXp(bpAddress, xps);
  console.log('finished');
}

main();
