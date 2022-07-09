import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { BattlepassResolver } from './battlepass.resolver';
import { UserModule } from './user/user.module';

@Module({
  providers: [BattlepassResolver],
  imports: [UserModule, MetadataModule],
})
export class BattlepassModule {}
