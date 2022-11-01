import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { CraftingModule } from 'src/crafting/crafting.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { RewardModule } from 'src/reward/reward.module';
import { ApiController } from './api.controller';

@Module({
  controllers: [ApiController],
  imports: [
    CraftingModule,
    BattlePassModule,
    MetadataModule,
    RewardModule,
    ClientsModule.registerAsync([
      {
        name: 'TWITCH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservice.twitch.host'),
            port: config.get<number>('microservice.twitch.port'),
          },
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
    ]),
  ],
})
export class ApiModule {}
