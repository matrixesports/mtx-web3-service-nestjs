import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { BattlePassDB } from './battle-pass.entity';

@Injectable()
export class BattlePassService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(BattlePassDB)
    private battlePassRepository: Repository<BattlePassDB>,
  ) {}
  /**
   * use rollback when updating shit
   */

  async getBattlePassDB(creatorId: number): Promise<BattlePassDB> {
    return await this.battlePassRepository.findOneByOrFail({
      creator_id: creatorId,
    });
  }
}
