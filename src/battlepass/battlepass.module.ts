import { Module } from '@nestjs/common';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';
import { BattlepassController } from './battlepass.controller';

@Module({
  providers: [BattlepassResolver],
  imports: [UserModule],
  controllers: [BattlepassController],
})
export class BattlepassModule {}
