import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { ContractService } from './contract.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  providers: [ContractService],
  exports: [ContractService],
})
@Global()
export class ContractModule {}
