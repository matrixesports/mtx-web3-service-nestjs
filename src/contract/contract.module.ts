import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { ContractService } from './contract.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  exports: [ContractService],
  providers: [ContractService],
  controllers: [],
})
@Global()
export class ContractModule {}
