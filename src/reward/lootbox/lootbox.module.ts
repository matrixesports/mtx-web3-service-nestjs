import { Module } from '@nestjs/common';
import { LootboxResolver } from './lootbox.resolver';

@Module({
  providers: [LootboxResolver],
})
export class LootboxModule {}
