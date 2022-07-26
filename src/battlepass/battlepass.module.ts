import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassController } from './battlepass.controller';
import { BattlePass } from './battlepass.entity';
import { BattlePassResolver } from './battlepass.resolver';
import { BattlePassService } from './battlepass.service';
import { UserModule } from './user/user.module';

@Module({
  providers: [BattlePassResolver, BattlePassService],
  imports: [UserModule, TypeOrmModule.forFeature([BattlePass])],
  controllers: [BattlePassController],
  exports: [BattlePassService],
})
export class BattlePassModule {}
