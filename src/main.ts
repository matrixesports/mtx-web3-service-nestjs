import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorInterceptor } from './common/error.interceptor';
import { GlobalFilter } from './common/filters';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new GlobalFilter());
  app.useGlobalInterceptors(new ErrorInterceptor());
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
