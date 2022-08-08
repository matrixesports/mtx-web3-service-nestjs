import { Module } from '@nestjs/common';
import { ScalarModule } from './scalar/scalar.module';

@Module({
  imports: [ScalarModule],
})
export class AppModule {}
