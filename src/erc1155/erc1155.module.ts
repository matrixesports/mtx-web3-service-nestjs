import { Module } from '@nestjs/common';
import { Erc1155Controller } from './erc1155.controller';
import { Erc1155Service } from './erc1155.service';
import { Erc1155Resolver } from './erc1155.resolver';

@Module({
  controllers: [Erc1155Controller],
  providers: [Erc1155Service, Erc1155Resolver]
})
export class Erc1155Module {}
