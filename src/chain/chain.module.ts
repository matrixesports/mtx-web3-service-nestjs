import { Global, Module } from '@nestjs/common';
import { ChainService } from './chain.service';

@Module({
  providers: [ChainService],
  exports: [ChainService],
})
@Global()
export class ChainModule {}
