import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BattlePassModule } from 'src/battlepass/battlepass.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { LeaderboardModule } from 'src/leaderboard/leaderboard.module';
import { LootboxResolver, LootdropResolver } from './reward.resolver';
import { RewardService } from './reward.service';

@Module({
  providers: [LootboxResolver, LootdropResolver, RewardService],
  imports: [
    BattlePassModule,
    LeaderboardModule,
    InventoryModule,
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
    ]),
  ],
  exports: [RewardService],
})
export class RewardModule {}
