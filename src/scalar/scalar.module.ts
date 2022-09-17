import { Module } from '@nestjs/common';
import { DateResolver, BigIntResolver } from './scalar.resolver';

@Module({
  providers: [DateResolver],
})
export class ScalarModule {}
