import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from 'src/modules/contract/entities/contract.entity';
import { ContractService } from 'src/modules/contract/contract.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  exports: [ContractService],
  providers: [ContractService],
  controllers: [],
})
@Global()
export class ContractModule {}
