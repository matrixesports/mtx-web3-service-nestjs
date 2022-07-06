import { Module } from '@nestjs/common';

import { MetadataService } from 'src/common/metadata/metadata.service';

@Module({
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
