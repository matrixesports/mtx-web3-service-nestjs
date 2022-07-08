import { Module } from '@nestjs/common';
import { BigintResolver } from './bigint.resolver';

@Module({
  providers: [BigintResolver],
})
export class BigintModule {}
