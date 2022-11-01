import { Module } from '@nestjs/common';
import {
  BattlePassResolver,
  PremiumUserResolver,
  UserResolver,
} from './battlepass.resolver';
import { BattlePassService } from './battlepass.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattlePassDB } from './battlepass.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InventoryModule } from 'src/inventory/inventory.module';

@Module({
  providers: [
    BattlePassResolver,
    BattlePassService,
    UserResolver,
    PremiumUserResolver,
  ],
  imports: [
    TypeOrmModule.forFeature([BattlePassDB]),
    InventoryModule,
    ClientsModule.registerAsync([
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
  controllers: [],
  exports: [BattlePassService],
})
export class BattlePassModule {}
