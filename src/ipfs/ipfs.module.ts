import { Module } from '@nestjs/common';
import { IpfsController } from './ipfs.controller';
import { IpfsService } from './ipfs.service';
import { IpfsResolver } from './ipfs.resolver';

@Module({
  controllers: [IpfsController],
  providers: [IpfsService, IpfsResolver],
})
export class IpfsModule {}
