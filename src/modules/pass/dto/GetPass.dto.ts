import { Contract } from 'ethers';
import { ContractDB } from 'src/common/directives/web3.service.directive';

export class GetPassDto {
  seasonId: number;
  contract: Contract;
  contractDB: ContractDB;
}
