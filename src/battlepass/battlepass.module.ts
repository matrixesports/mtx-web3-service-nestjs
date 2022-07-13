import { Module } from '@nestjs/common';
import { BattlePassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';
import { BattlePassController } from './battlepass.controller';
import { BattlePassService } from './battlepass.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePass } from './battlepass.entity';

@Module({
  providers: [BattlePassResolver, BattlePassService],
  imports: [UserModule, TypeOrmModule.forFeature([BattlePass])],
  controllers: [BattlePassController],
  exports: [BattlePassService],
})
export class BattlePassModule {}
