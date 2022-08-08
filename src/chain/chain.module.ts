import { Module } from '@nestjs/common';
import { ChainService } from './chain.service';

@Module({
  providers: [ChainService]
})
export class ChainModule {}
