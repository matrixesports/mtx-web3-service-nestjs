import { Module } from '@nestjs/common';
import {
  BattlePassResolver,
  PremiumUserResolver,
  UserResolver,
} from './battlepass.resolver';
import { BattlePassService } from './battlepass.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battlepass.entity';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  providers: [
    BattlePassResolver,
    BattlePassService,
    UserResolver,
    PremiumUserResolver,
    MetadataModule,
  ],
  imports: [TypeOrmModule.forFeature([BattlePassDB]), MetadataModule],
  controllers: [],
  exports: [BattlePassService],
})
export class BattlePassModule {}
