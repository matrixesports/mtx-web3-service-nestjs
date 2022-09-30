import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { CraftingModule } from 'src/crafting/crafting.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  imports: [
    CraftingModule,
    BattlePassModule,
    MetadataModule,
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
    ]),
  ],
})
export class AdminModule {}
