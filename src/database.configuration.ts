import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const datasource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  ...{
    migrations: ['dist/src/db/migrations/**/*.js'],
    cli: {
      migrationsDir: 'src/db/migrations',
    },
  },
});

export default datasource;
