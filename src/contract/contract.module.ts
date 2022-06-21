import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { ContractResolver } from './contract.resolver';
import { ContractService } from './contract.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  exports: [ContractService],
  providers: [ContractService, ContractResolver],
  controllers: [],
})
@Global()
export class ContractModule {}
