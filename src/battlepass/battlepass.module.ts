import { Module } from '@nestjs/common';
import {
  BattlePassResolver,
  PremiumUserResolver,
  UserResolver,
} from './battlepass.resolver';
import { BattlePassService } from './battlepass.service';
import { BattlePassController } from './battlepass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battlepass.entity';
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
