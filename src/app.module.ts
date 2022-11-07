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
import { BattlePassModule } from './battlepass/battlepass.module';
import { ChainModule } from './chain/chain.module';
import { RewardModule } from './reward/reward.module';
import { InventoryModule } from './inventory/inventory.module';
import { CraftingModule } from './crafting/crafting.module';
import { GraphQLPlugin } from './common/gql.plugin';
import { GraphQLError } from 'graphql';
import { LoggerModule } from 'nestjs-pino';
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { ApiModule } from './api/api.module';
import { MicroserviceModule } from './microservice/microservice.module';

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
        customErrorObject: (_req, _res, _error, val) => {
          // no error context for info logs
          delete val['err'];
          return {
            ...val,
          };
        },
        serializers: {
          req: (req: any) => {
            req['user-address'] = req['headers']['user-address'];
            req.body = req.raw.body;
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
        PUB_ADDR: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),
        CHAIN_ID: Joi.number().required(),
        CHAIN_NAME: Joi.string().required(),
        POLYGON_RPC: Joi.string().required(),
        ALCHEMY_API_KEY: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        DEV_DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        DEV_REDIS_URL: Joi.string().required(),
        USER_SERVICE_HOST: Joi.string().required(),
        USER_SERVICE_PORT: Joi.number().required(),
        DEV_USER_SERVICE_HOST: Joi.string().required(),
        DEV_USER_SERVICE_PORT: Joi.number().required(),
        USER_SERVICE_API_TOKEN: Joi.string().required(),
        DEV_USER_SERVICE_API_TOKEN: Joi.string().required(),
        TICKET_SERVICE_HOST: Joi.string().required(),
        TICKET_SERVICE_PORT: Joi.number().required(),
        DEV_TICKET_SERVICE_HOST: Joi.string().required(),
        DEV_TICKET_SERVICE_PORT: Joi.number().required(),
        TWITCH_SERVICE_HOST: Joi.string().required(),
        TWITCH_SERVICE_PORT: Joi.number().required(),
        DEV_TWITCH_SERVICE_HOST: Joi.string().required(),
        DEV_TWITCH_SERVICE_PORT: Joi.number().required(),
        URL_SERVICE_HOST: Joi.string().required(),
        URL_SERVICE_PORT: Joi.number().required(),
        DEV_URL_SERVICE_HOST: Joi.string().required(),
        DEV_URL_SERVICE_PORT: Joi.number().required(),
        DISCORD_BOT_HOST: Joi.string().required(),
        DISCORD_BOT_PORT: Joi.number().required(),
        DEV_DISCORD_BOT_HOST: Joi.string().required(),
        DEV_DISCORD_BOT_PORT: Joi.number().required(),
        BP_FACTORY: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),
        DEV_BP_FACTORY: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),
        CRAFTING_PROXY: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),
        DEV_CRAFTING_PROXY: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),
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
          url: config.get<string>('storage.postgres'),
          autoLoadEntities: true,
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        definitions: {
          path: join(process.cwd(), 'src/graphql.schema.ts'),
          outputAs: 'class',
          defaultScalarType: 'unknown',
        },
        typePaths: ['./**/*.graphql'],
        playground: false,
        debug: true, // stacktrace for error context
        formatError: (error) => {
          //const message = 'on-chain error';
          return new GraphQLError(error.message);
        },
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
      }),
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<RedisModuleOptions> => {
        return {
          config: {
            url: config.get<string>('storage.redis'),
          },
        };
      },
    }),
    ScalarModule,
    BattlePassModule,
    ChainModule,
    RewardModule,
    InventoryModule,
    CraftingModule,
    ApiModule,
    MicroserviceModule,
  ],
  providers: [GraphQLPlugin],
})
export class AppModule {}
