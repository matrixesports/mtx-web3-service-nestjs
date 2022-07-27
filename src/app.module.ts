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
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import * as Joi from 'joi';
import { join } from 'path';
import { BattlePassModule } from './battlepass/battlepass.module';
import configuration from './configuration';
import { ContractModule } from './contract/contract.module';
import { InventoryModule } from './inventory/inventory.module';
import { RecipeModule } from './recipe/recipe.module';
import { LootboxModule } from './reward/lootbox/lootbox.module';
import { LoggerModule } from 'nestjs-pino';
import { GraphQLLogger } from './common/plugins/gql.logger';
import { ScalarModule } from './scalar/scalar.module';

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
              return req["params"]["0"] === "graphql" ? true : false;
            }
        },
        customErrorObject: (req, res, error, val) => {
          delete val["err"];      
          return {
            ...val,
          };
        },
        serializers: {
          req: (req) => {
            req["user-address"] = req["headers"]["user-address"]
            delete req["headers"]; //GDPR compliant ?
            return req;
          },
          res: (res) => {
            delete res["headers"]; //GDPR compliant ?
            return res;
          }
        }
      }
    }),
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
      debug: true,  // stacktrace
      formatError : (error) => {
        let newError = JSON.parse(JSON.stringify(error))
        delete newError["extensions"];
        delete newError["locations"];
        delete newError["path"];
        if (newError["message"].search("https://polygon-mainnet.g.alchemy.com/v2/")) {
          newError["message"] = "on-chain error"; // hide provider
        }
        return newError;
      }
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      typePaths: ['**/*.graphql'],
    }),
    ScalarModule,
    BattlePassModule,
    ContractModule,
    RecipeModule,
    InventoryModule,
    LootboxModule,
  ],
  controllers: [],
  providers: [GraphQLLogger],
})
export class AppModule {}
