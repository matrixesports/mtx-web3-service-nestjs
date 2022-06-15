import { Resolver } from '@nestjs/graphql';
import { ContractService } from './contract.service';

// only show active recipes
// should resolve on its own
@Resolver('ContractDb')
export class RecipeResolver {
  constructor(private contractService: ContractService) {}
}
