import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecipeModule } from './recipe/recipe.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractModule } from './contract/contract.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { PassModule } from './pass/pass.module';
import { ScalarModule } from './scalar/scalar.module';

import { RedeemableModule } from './redeemable/redeemable.module';
import { OracleModule } from './oracle/oracle.module';
import { LootboxModule } from './lootbox/lootbox.module';
import { TokenBundleModule } from './token-bundle/token-bundle.module';
import { InventoryModule } from './inventory/inventory.module';
import { Erc1155Module } from './erc1155/erc1155.module';
import { Erc721Module } from './erc721/erc721.module';
import { Erc20Module } from './erc20/erc20.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          type: 'postgres',
          url: config.get('RAILWAY_URL'),
          autoLoadEntities: true,
        };
      },
    }),
    ContractModule,
    // Erc20Module,
    // Erc721Module,
    // Erc1155Module,
    // InventoryModule,
    // IpfsModule,
    // LootboxModule,
    // OracleModule,
    PassModule,
    // RecipeModule,
    // RedeemableModule,
    // ScalarModule,
    // TokenBundleModule,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
