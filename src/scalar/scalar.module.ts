import { Module } from '@nestjs/common';
import { ScalarResolver } from './scalar.resolver';

@Module({
  providers: [ScalarResolver],
})
export class ScalarModule {}
