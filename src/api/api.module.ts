import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { CraftingModule } from 'src/crafting/crafting.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { MicroserviceModule } from 'src/microservice/microservice.module';
import { RewardModule } from 'src/reward/reward.module';
import { ApiController } from './api.controller';

@Module({
  controllers: [ApiController],
  imports: [CraftingModule, BattlePassModule, InventoryModule, RewardModule, MicroserviceModule],
})
export class ApiModule {}
