import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataDB } from './metadata.entity';
import { MetadataService } from './metadata.service';

@Module({
  providers: [MetadataService],
  imports: [TypeOrmModule.forFeature([MetadataDB])],
  exports: [MetadataService],
})
export class MetadataModule {}
