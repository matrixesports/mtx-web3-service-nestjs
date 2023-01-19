import { Module } from '@nestjs/common';
import {
  AllSeasonRankingResolver,
  BattlePassResolver,
  LootboxResolver,
  PremiumUserResolver,
  ReputationRankingResolver,
  SeasonRankingResolver,
  UserResolver,
} from './battlepass.resolver';
import { BattlePassService } from './battlepass.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battlepass.entity';
import { InventoryModule } from 'src/inventory/inventory.module';
import { ChainModule } from 'src/chain/chain.module';
import { MicroserviceModule } from 'src/microservice/microservice.module';
import { ManacubeModule } from 'src/manacube/manacube.module';

@Module({
  providers: [
    BattlePassResolver,
    BattlePassService,
    UserResolver,
    PremiumUserResolver,
    AllSeasonRankingResolver,
    SeasonRankingResolver,
    ReputationRankingResolver,
    LootboxResolver,
  ],
  imports: [
    ChainModule,
    MicroserviceModule,
    TypeOrmModule.forFeature([BattlePassDB]),
    InventoryModule,
    ManacubeModule,
  ],
  controllers: [],
  exports: [BattlePassService],
})
export class BattlePassModule {}
