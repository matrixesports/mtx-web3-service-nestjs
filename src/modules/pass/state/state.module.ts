import { Module } from '@nestjs/common';
import { StateResolver } from './state.resolver';

@Module({
  providers: [StateResolver],
})
export class StateModule {}
