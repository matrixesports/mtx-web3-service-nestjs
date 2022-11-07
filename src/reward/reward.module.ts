import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { LootboxResolver } from 'src/battlepass/battlepass.resolver';
import { ChainModule } from 'src/chain/chain.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { MicroserviceModule } from 'src/microservice/microservice.module';
import { RewardService } from './reward.service';

@Module({
  providers: [RewardService, LootboxResolver],
  imports: [BattlePassModule, InventoryModule, ChainModule, MicroserviceModule],
  exports: [RewardService],
})
export class RewardModule {}
