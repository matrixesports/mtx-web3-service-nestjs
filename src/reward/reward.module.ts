import { Module } from '@nestjs/common';
import { RewardResolver } from './reward.resolver';
import { MetadataModule } from './metadata/metadata.module';

@Module({
  providers: [RewardResolver],
  imports: [MetadataModule]
})
export class RewardModule {}
