import { Contract } from 'ethers';
import { ContractDB } from 'src/graphql.schema';

export class GetPassDto {
  seasonId: number;
  contract: Contract;
  contractDB: ContractDB;
}
