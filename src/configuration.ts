export default () => {
  const config = {
    PVT_KEY: process.env.PVT_KEY,
    PUB_ADDR: process.env.PUB_ADDR,
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
    storage: {
      postgres: process.env.DATABASE_URL,
      redis: process.env.REDIS_URL,
    },
    microservice: {
      twitch: {
        host: process.env.TWITCH_SERVICE_HOST,
        port: parseInt(process.env.TWITCH_SERVICE_PORT),
        url:
          'http://' +
          process.env.TWITCH_SERVICE_HOST +
          ':' +
          parseInt(process.env.TWITCH_SERVICE_PORT),
      },
      discord: {
        host: process.env.DISCORD_BOT_HOST,
        port: parseInt(process.env.DISCORD_BOT_PORT),
        url:
          'http://' + process.env.DISCORD_BOT_HOST + ':' + parseInt(process.env.DISCORD_BOT_PORT),
      },
      ticket: {
        host: process.env.TICKET_SERVICE_HOST,
        port: parseInt(process.env.TICKET_SERVICE_PORT),
        url:
          'http://' +
          process.env.TICKET_SERVICE_HOST +
          ':' +
          parseInt(process.env.TICKET_SERVICE_PORT),
      },
      user: {
        host: process.env.USER_SERVICE_HOST,
        port: parseInt(process.env.USER_MICROSERVICE_PORT),
        url: 'http://' + process.env.USER_SERVICE_HOST + ':3000',
        token: process.env.USER_SERVICE_API_TOKEN,
      },
      url: {
        host: process.env.URL_SERVICE_HOST,
        port: parseInt(process.env.URL_SERVICE_PORT),
        url:
          'http://' + process.env.URL_SERVICE_HOST + ':' + parseInt(process.env.URL_SERVICE_PORT),
      },
    },
  };
  return config;
};
