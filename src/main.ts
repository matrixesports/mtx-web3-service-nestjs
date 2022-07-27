import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { GlobalFilter } from './common/filters/global.filter';
import { ErrorInterceptor } from './common/interceptors/errorr.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new GlobalFilter());
  app.useGlobalInterceptors(new ErrorInterceptor())
  app.setGlobalPrefix('api');
  await app.listen(3000);
}

bootstrap();
