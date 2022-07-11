import { Module } from '@nestjs/common';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';
import { BattlepassController } from './battlepass.controller';
import { BattlepassService } from './battlepass.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePass } from './battlepass.entity';

@Module({
  providers: [BattlepassResolver, BattlepassService],
  imports: [UserModule, TypeOrmModule.forFeature([BattlePass])],
  controllers: [BattlepassController],
  exports: [BattlepassService],
})
export class BattlepassModule {}
