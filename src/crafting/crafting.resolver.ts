import { Resolver } from '@nestjs/graphql';
import { ChainService } from 'src/chain/chain.service';
import { CraftingService } from './crafting.service';

@Resolver('Crafting')
export class CraftingResolver {
  constructor(
    private chainService: ChainService,
    private craftingService: CraftingService,
  ) {}
}
