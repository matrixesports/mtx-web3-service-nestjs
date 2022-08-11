import { Module } from '@nestjs/common';
import { CraftingModule } from 'src/crafting/crafting.module';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  imports: [CraftingModule],
})
export class AdminModule {}
