import { Global, Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { Contract } from './contract.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  exports: [ContractService],
  providers: [ContractService],
  controllers: [ContractController],
})
@Global()
export class ContractModule {}
