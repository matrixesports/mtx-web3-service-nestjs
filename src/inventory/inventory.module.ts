import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { Contract } from 'src/contract/contract.entity';
import { InventoryResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';

@Module({
  providers: [InventoryResolver, InventoryService],
  imports: [BattlePassModule, TypeOrmModule.forFeature([Contract])],
})
export class InventoryModule {}
