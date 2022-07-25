import {
  ApolloDriverConfig,
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import * as Joi from 'joi';
import { join } from 'path';
import { BattlePassModule } from './battlepass/battlepass.module';
import configuration from './configuration';
import { ContractModule } from './contract/contract.module';
import { InventoryModule } from './inventory/inventory.module';
import { MetadataModule } from './metadata/metadata.module';
import { RecipeModule } from './recipe/recipe.module';
import { LootboxModule } from './reward/lootbox/lootbox.module';
import { RedeemableModule } from './reward/redeemable/redeemable.module';
import { ScalarModule } from './scalar/scalar.module';
import responseCachePlugin from 'apollo-server-plugin-response-cache';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validationSchema: Joi.object({
        PVT_KEY: Joi.string().required(),
        POLYGONSCAN_API_KEY: Joi.string().required(),
        POLYGON_RPC: Joi.string().required(),
        DB_WEB3_SERVICE_URL: Joi.string().required(),
        DB_STAGING_WEB3_SERVICE_URL: Joi.string().required(),
        USER_SERVICE_URL: Joi.string().required(),
        STAGING_USER_SERVICE_URL: Joi.string().required(),
        TICKET_SERVICE_URL: Joi.string().required(),
        STAGING_TICKET_SERVICE_URL: Joi.string().required(),
        TWITCH_SERVICE_URL: Joi.string().required(),
        STAGING_TWITCH_SERVICE_URL: Joi.string().required(),
        PINATA_API_KEY: Joi.string().required(),
        PINATA_API_SECRET: Joi.string().required(),
        PINATA_GATEWAY: Joi.string().required(),
        ALCHEMY_API_KEY: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          type: 'postgres',
          url: config.get('WEB3_DATABASE'),
          autoLoadEntities: true,
        };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      definitions: {
        path: join(process.cwd(), 'src/graphql.schema.ts'),
        outputAs: 'class',
        defaultScalarType: 'unknown',
      },
      typePaths: ['./**/*.graphql'],
      driver: ApolloFederationDriver,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault(),
        responseCachePlugin(),
      ],
      playground: false,
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
    ScalarModule,
    BattlePassModule,
    MetadataModule,
    ContractModule,
    RecipeModule,
    InventoryModule,
    RedeemableModule,
    LootboxModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
