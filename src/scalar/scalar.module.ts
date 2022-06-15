import { Module } from '@nestjs/common';
import { ScalarController } from './scalar.controller';
import { ScalarResolver } from './scalar.resolver';

@Module({
  controllers: [ScalarController],
  providers: [ScalarResolver]
})
export class ScalarModule {}
