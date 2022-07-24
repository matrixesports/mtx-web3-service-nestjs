export default () => {
  let WEB3_DATABASE;
  let ticket;
  let user;
  let twitch;

  if (process.env.ZEET_ENVIRONMENT == 'main') {
    WEB3_DATABASE = process.env.DB_WEB3_SERVICE_URL;
    ticket = process.env.TICKET_SERVICE_URL;
    user = process.env.USER_SERVICE_URL;
    twitch = process.env.TWITCH_SERVICE_URL;
  } else {
    WEB3_DATABASE = process.env.DB_STAGING_WEB3_SERVICE_URL;
    ticket = process.env.STAGING_TICKET_SERVICE_URL;
    user = process.env.STAGING_USER_SERVICE_URL;
    twitch = process.env.STAGING_TWITCH_SERVICE_URL;
  }

  let config = {
    PVT_KEY: process.env.PVT_KEY,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    POLYGON: {
      polygonscan: process.env.POLYGONSCAN_API_KEY,
      rpc: process.env.POLYGON_RPC,
    },
    WEB3_DATABASE,
    SERVICE: {
      ticket,
      user,
      twitch,
    },
    PINATA: {
      key: process.env.PINATA_API_KEY,
      secret: process.env.PINATA_API_SECRET,
      gateway: process.env.PINATA_GATEWAY,
    },
  };
  return config;
};
