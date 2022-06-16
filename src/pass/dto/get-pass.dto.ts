import { ethers } from 'ethers';
import { Contract } from 'src/contract/contract.entity';

export class GetPassDto {
  contract: ethers.Contract;
  contractDB: Contract;
  activePassId: number;
}
