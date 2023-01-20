import { Module } from '@nestjs/common';
import { ManacubeService } from './manacube.service';
import { ManacubeResolver } from './manacube.resolver';
import { MicroserviceModule } from 'src/microservice/microservice.module';

@Module({
  imports: [MicroserviceModule],
  providers: [ManacubeService, ManacubeResolver],
  exports: [ManacubeService],
})
export class ManacubeModule {}
