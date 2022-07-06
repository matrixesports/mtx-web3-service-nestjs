module.exports = [
  {
    type: 'postgres',
    host:
      process.env.ZEET_ENVIRONMENT !== 'main'
        ? process.env.DEV_DB_HOST
        : process.env.DB_HOST,
    port:
      process.env.ZEET_ENVIRONMENT !== 'main'
        ? parseInt(process.env.DEV_DB_PORT)
        : parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password:
      process.env.ZEET_ENVIRONMENT !== 'main'
        ? process.env.DEV_DB_PASSWORD
        : process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: false,
    // ssl: false,
    /*extra: {
        ssl: {
          rejectUnauthorized: false,
        }
      },*/
    migrations: ['dist/migrations/*{.ts,.js}'],
    cli: {
      migrationsDir: 'src/migrations',
    },
  },
];
