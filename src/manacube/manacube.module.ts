import { Module } from '@nestjs/common';
import { ManacubeController } from './manacube.controller';
import { ManacubeService } from './manacube.service';

@Module({
  controllers: [ManacubeController],
  providers: [ManacubeService],
  exports: [ManacubeService],
})
export class ManacubeModule {}
