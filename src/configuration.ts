export default () => {
  let db;
  let ticketService;
  let userService;
  let twitchService;

  if (process.env.ZEET_ENVIRONMENT == 'main') {
    db = process.env.DB_WEB3_SERVICE_URL;
    ticketService = process.env.TICKET_SERVICE_URL;
    userService = process.env.USER_SERVICE_URL;
    twitchService = process.env.TWITCH_SERVICE_URL;
  } else {
    db = process.env.DB_STAGING_WEB3_SERVICE_URL;
    ticketService = process.env.STAGING_TICKET_SERVICE_URL;
    userService = process.env.STAGING_USER_SERVICE_URL;
    twitchService = process.env.STAGING_TWITCH_SERVICE_URL;
  }

  let config = {
    PVT_KEY: process.env.PVT_KEY,
    rpc: {
      url: process.env.POLYGON_RPC,
      chainId: process.env.CHAIN_ID,
      name: process.env.CHAIN_NAME,
      apiKey: process.env.ALCHEMY_API_KEY,
    },
    contracts: {
      bpFactory: process.env.BP_FACTORY,
      craftingProxy: process.env.CRAFTING_PROXY,
    },
    db,
    SERVICE: {
      ticketService,
      userService,
      twitchService,
    },
  };
  return config;
};
