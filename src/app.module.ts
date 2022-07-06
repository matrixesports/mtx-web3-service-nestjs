import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractModule } from 'src/modules/contract/contract.module';
import { PassModule } from 'src/modules/pass/pass.module';
import { ScalarModule } from 'src/common/scalar/scalar.module';
import { Erc1155Module } from 'src/common/erc1155/erc1155.module';
import { MetadataModule } from 'src/common/metadata/metadata.module';

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
    ContractModule,
    PassModule,
    ScalarModule,
    Erc1155Module,
    MetadataModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
