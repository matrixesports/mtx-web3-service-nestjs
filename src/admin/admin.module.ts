import { Module } from '@nestjs/common';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { CraftingModule } from 'src/crafting/crafting.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  imports: [CraftingModule, BattlePassModule, MetadataModule],
})
export class AdminModule {}
