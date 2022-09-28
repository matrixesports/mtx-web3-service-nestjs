import { Module } from '@nestjs/common';
import { DateResolver } from './scalar.resolver';

@Module({
  providers: [DateResolver],
})
export class ScalarModule {}
