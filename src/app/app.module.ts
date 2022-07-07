import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';

@Module({
  providers: [AppService, AppResolver],
  controllers: [AppController]
})
export class AppModule {}
