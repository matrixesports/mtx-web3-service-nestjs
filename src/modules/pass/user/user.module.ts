import { Module } from '@nestjs/common';
import { PassModule } from '../pass.module';
import { UserResolver } from './user.resolver';

@Module({
  providers: [UserResolver],
})
export class UserModule {}
