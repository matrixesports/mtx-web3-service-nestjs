import { Module } from '@nestjs/common';
import { ScalarResolver } from 'src/common/scalar/scalar.resolver';

@Module({
  providers: [ScalarResolver],
})
export class ScalarModule {}
