import { Module } from '@nestjs/common';
import { Erc721Controller } from './erc721.controller';
import { Erc721Service } from './erc721.service';
import { Erc721Resolver } from './erc721.resolver';

@Module({
  controllers: [Erc721Controller],
  providers: [Erc721Service, Erc721Resolver]
})
export class Erc721Module {}
