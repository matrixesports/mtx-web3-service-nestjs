import { Module } from '@nestjs/common';
import { ContractModule } from 'src/contract/contract.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { RecipeResolver } from './recipe.resolver';

@Module({
  providers: [RecipeResolver],
  imports: [ContractModule, MetadataModule],
})
export class RecipeModule {}
