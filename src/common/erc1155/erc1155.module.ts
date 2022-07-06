import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/common/metadata/metadata.module';
import { Erc1155Resolver } from 'src/common/erc1155/erc1155.resolver';
import { Erc1155Service } from 'src/common/erc1155/erc1155.service';

@Module({
  providers: [Erc1155Resolver, Erc1155Service],
  imports: [MetadataModule],
})
export class Erc1155Module {}
