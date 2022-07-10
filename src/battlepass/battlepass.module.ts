import { Module } from '@nestjs/common';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';
import { BattlepassController } from './battlepass.controller';
import { BattlepassService } from './battlepass.service';

@Module({
  providers: [BattlepassResolver, BattlepassService],
  imports: [UserModule],
  controllers: [BattlepassController],
  exports: [BattlepassService],
})
export class BattlepassModule {}
