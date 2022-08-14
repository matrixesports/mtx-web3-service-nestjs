import {
  ApolloDriverConfig,
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { join } from 'path';
import configuration from './configuration';
import { ScalarModule } from './scalar/scalar.module';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { BattlePassModule } from './battle-pass/battle-pass.module';
import { ChainModule } from './chain/chain.module';
import { MetadataModule } from './metadata/metadata.module';
import { LootboxModule } from './reward/lootbox/lootbox.module';
import { InventoryModule } from './inventory/inventory.module';
import { AdminModule } from './admin/admin.module';
import { CraftingModule } from './crafting/crafting.module';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLPlugin } from './common/gql.plugin';
import { GraphQLError } from 'graphql';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        base: null,
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
        autoLogging: {
          ignore: (req) => {
            // no auto logging for gql
            return req['params']['0'] === 'graphql' ? true : false;
          },
        },
        customErrorObject: (req, res, error, val) => {
          // no error context for info logs
          delete val['err'];
          return {
            ...val,
          };
        },
        serializers: {
          req: (req: any) => {
            req['user-address'] = req['headers']['user-address'];
            delete req['headers']; //GDPR compliant
            return req;
          },
          res: (res: any) => {
            delete res['headers']; //GDPR compliant
            return res;
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validationSchema: Joi.object({
        PVT_KEY: Joi.string().required(),
        CHAIN_ID: Joi.number().required(),
        CHAIN_NAME: Joi.string().required(),
        POLYGON_RPC: Joi.string().required(),
        DB_WEB3_SERVICE_URL: Joi.string().required(),
        DB_STAGING_WEB3_SERVICE_URL: Joi.string().required(),
        USER_SERVICE_URL: Joi.string().required(),
        STAGING_USER_SERVICE_URL: Joi.string().required(),
        TICKET_SERVICE_URL: Joi.string().required(),
        STAGING_TICKET_SERVICE_URL: Joi.string().required(),
        TWITCH_SERVICE_URL: Joi.string().required(),
        STAGING_TWITCH_SERVICE_URL: Joi.string().required(),
        ALCHEMY_API_KEY: Joi.string().required(),
        CRAFTING_PROXY: Joi.string().required(),
        BP_FACTORY: Joi.string().required(),
        TEST_CRAFTING_PROXY: Joi.string().required(),
        TEST_BP_FACTORY: Joi.string().required(),
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
          url: config.get('db'),
          autoLoadEntities: true,
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        definitions: {
          path: join(process.cwd(), 'src/graphql.schema.ts'),
          outputAs: 'class',
          defaultScalarType: 'unknown',
        },
        typePaths: ['./**/*.graphql'],
        playground: false,
        debug: true, // stacktrace for error context
        formatError: (err) => {
          const message = err.message.search(config.get('rpc').url)
            ? 'on-chain error'
            : err.message;
          return new GraphQLError(message);
        },
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
      }),
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
    ScalarModule,
    BattlePassModule,
    ChainModule,
    MetadataModule,
    LootboxModule,
    InventoryModule,
    CraftingModule,
    AdminModule,
  ],
  providers: [GraphQLPlugin],
})
export class AppModule {}
