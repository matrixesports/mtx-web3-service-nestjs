import { Module } from '@nestjs/common';
import { TokenBundleController } from './token-bundle.controller';
import { TokenBundleService } from './token-bundle.service';
import { TokenBundleResolver } from './token-bundle.resolver';

@Module({
  controllers: [TokenBundleController],
  providers: [TokenBundleService, TokenBundleResolver]
})
export class TokenBundleModule {}
