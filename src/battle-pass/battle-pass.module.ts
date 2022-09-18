import { Module } from '@nestjs/common';
import {
  BattlePassResolver,
  PremiumUserResolver,
  UserResolver,
} from './battle-pass.resolver';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battle-pass.entity';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  providers: [
    BattlePassResolver,
    BattlePassService,
    UserResolver,
    PremiumUserResolver,
  ],
  imports: [TypeOrmModule.forFeature([BattlePassDB]), MetadataModule],
  controllers: [BattlePassController],
  exports: [BattlePassService],
})
export class BattlePassModule {}
