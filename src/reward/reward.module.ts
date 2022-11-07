import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { ChainModule } from 'src/chain/chain.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { MicroserviceModule } from 'src/microservice/microservice.module';
import { LootdropResolver } from './reward.resolver';
import { RewardService } from './reward.service';

@Module({
  providers: [RewardService, LootdropResolver],
  imports: [BattlePassModule, InventoryModule, ChainModule, MicroserviceModule],
  exports: [RewardService],
})
export class RewardModule {}
