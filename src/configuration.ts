export default () => ({
  PVT_KEY: process.env.PVT_KEY,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  POLYGON: {
    polygonscan: process.env.POLYGONSCAN_API_KEY,
    rpc: process.env.POLYGON_RPC,
  },
  WEB3_DATABASE:
    process.env.ENV == 'dev'
      ? process.env.DB_STAGING_WEB3_SERVICE_URL
      : process.env.DB_WEB3_SERVICE_URL,

  SERVICE: {
    ticket:
      process.env.ENV == 'dev'
        ? process.env.STAGING_TICKET_SERVICE_URL
        : process.env.TICKET_SERVICE_URL,
    user:
      process.env.ENV == 'dev'
        ? process.env.STAGING_USER_SERVICE_URL
        : process.env.USER_SERVICE_URL,
    twitch:
      process.env.ENV == 'dev'
        ? process.env.STAGING_TWITCH_SERVICE_URL
        : process.env.TWITCH_SERVICE_URL,
  },
  PINATA: {
    key: process.env.PINATA_API_KEY,
    secret: process.env.PINATA_API_SECRET,
    gateway: process.env.PINATA_GATEWAY,
  },
});
