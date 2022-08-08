import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetadataDB } from './metadata.entity';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(MetadataDB)
    private metadataRepository: Repository<MetadataDB>,
  ) {}

  async getMetadata(creatorId: number, id: number): Promise<MetadataDB> {
    try {
      return await this.metadataRepository.findOneByOrFail({
        creator_id: creatorId,
        id,
      });
    } catch (e) {
      return null;
    }
  }
}
