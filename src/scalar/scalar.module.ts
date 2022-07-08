import { Module } from '@nestjs/common';
import { DateModule } from './date/date.module';
import { BigintModule } from './bigint/bigint.module';

@Module({
  imports: [DateModule, BigintModule]
})
export class ScalarModule {}
