import { Module } from '@nestjs/common';
import { LootboxController } from './lootbox.controller';
import { LootboxService } from './lootbox.service';
import { LootboxResolver } from './lootbox.resolver';

@Module({
  controllers: [LootboxController],
  providers: [LootboxService, LootboxResolver],
})
export class LootboxModule {}
