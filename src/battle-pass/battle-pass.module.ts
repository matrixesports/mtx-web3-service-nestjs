import { Module } from '@nestjs/common';
import { BattlePassResolver } from './battle-pass.resolver';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battle-pass.entity';
import { MetadataModule } from 'src/metadata/metadata.module';
import { UserResolver } from './battle-pass-user.resolver';
import { PremiumUserResolver } from './battle-pass-prem-user';

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
