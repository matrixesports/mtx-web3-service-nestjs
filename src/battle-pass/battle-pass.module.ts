import { Module } from '@nestjs/common';
import { BattlePassResolver } from './battle-pass.resolver';
import { BattlePassService } from './battle-pass.service';
import { BattlePassController } from './battle-pass.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battle-pass.entity';
import { MetadataModule } from 'src/metadata/metadata.module';
import { UserModule } from './user/user.module';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  providers: [BattlePassResolver, BattlePassService],
  imports: [
    TypeOrmModule.forFeature([BattlePassDB]),
    MetadataModule,
    UserModule,
    InventoryModule,
  ],
  controllers: [BattlePassController],
  exports: [BattlePassService],
})
export class BattlePassModule {}
