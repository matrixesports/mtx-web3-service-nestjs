import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MicroserviceService, MockController } from './microservice.service';

@Module({
  providers: [MicroserviceService],
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'TWITCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          options: {
            host: config.get<string>('microservice.twitch.host'),
            port: config.get<number>('microservice.twitch.port'),
          },
          transport: Transport.TCP,
        }),
      },
      {
        name: 'DISCORD_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservice.discord.host'),
            port: config.get<number>('microservice.discord.port'),
          },
        }),
      },
      {
        name: 'USSER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          options: {
            host: config.get<string>('microservice.user.host'),
            port: config.get<number>('microservice.user.port'),
          },
          transport: Transport.TCP,
        }),
      },
    ]),
  ],
  exports: [MicroserviceService],
  controllers: [MockController],
})
export class MicroserviceModule {}
