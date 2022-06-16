import { Injectable } from '@nestjs/common';
import { ContractService } from 'src/contract/contract.service';

@Injectable()
export class PassService {
  constructor(private contractService: ContractService) {}
}
