import { Module } from '@nestjs/common';
import { PassController } from './pass.controller';
import { PassService } from './pass.service';
import { PassResolver } from './pass.resolver';

@Module({
  controllers: [PassController],
  providers: [PassService, PassResolver]
})
export class PassModule {}
