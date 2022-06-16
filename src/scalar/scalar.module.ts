import { Module } from '@nestjs/common';
import { ScalarResolver } from './scalar.resolver';

@Module({
  controllers: [],
  providers: [ScalarResolver],
})
export class ScalarModule {}
