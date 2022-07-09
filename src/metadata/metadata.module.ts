import { Global, Module } from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Module({
  providers: [MetadataService],
  exports: [MetadataService],
})
@Global()
export class MetadataModule {}
