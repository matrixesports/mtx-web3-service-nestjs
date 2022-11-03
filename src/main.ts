import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorInterceptor } from './common/error.interceptor';
import { GlobalFilter } from './common/filters';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new GlobalFilter());
  app.useGlobalInterceptors(new ErrorInterceptor());
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('MTX Web3 Service API')
    .setDescription('API Specification & TCP Events')
    .setContact('bo', '', 'bo@mtx.gg')
    .setVersion('1.0')
    .addTag(
      'TCP EVENTS',
      'Events emitted for on-chain actions, can be consumned by other services, eg. discord bot',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFile('docs/api.json', JSON.stringify(document), function (err) {
    if (err) {
      console.log(err);
    }
  });
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
