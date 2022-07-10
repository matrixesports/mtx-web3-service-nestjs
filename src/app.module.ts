import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScalarModule } from './scalar/scalar.module';
import { BattlepassModule } from './battlepass/battlepass.module';
import { MetadataModule } from './metadata/metadata.module';
import { ContractModule } from './contract/contract.module';
import { RecipeModule } from './recipe/recipe.module';
import { InventoryModule } from './inventory/inventory.module';
import { RedeemableModule } from './reward/redeemable/redeemable.module';
import { LootboxModule } from './reward/lootbox/lootbox.module';
import configuration from './configuration';
import * as Joi from 'joi';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').default('dev'),
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
      driver: ApolloDriver,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      playground: false,
    }),
    ScalarModule,
    BattlepassModule,
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
