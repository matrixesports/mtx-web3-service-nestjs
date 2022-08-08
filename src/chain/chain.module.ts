import { Global, Module } from '@nestjs/common';
import { ChainService } from './chain.service';

@Module({
  providers: [ChainService],
})
@Global()
export class ChainModule {}
