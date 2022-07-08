import { Module } from '@nestjs/common';
import { LevelinfoResolver } from './levelinfo.resolver';

@Module({
  providers: [LevelinfoResolver]
})
export class LevelinfoModule {}
