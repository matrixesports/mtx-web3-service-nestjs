export default () => {
  let postgres: string, redis: string;
  let ticketHost: string, ticketPort: number;
  let userHost: string, userPort: number, userApiToken: string;
  let twitchHost: string, twitchPort: number;
  let urlHost: string, urlPort: number;
  let discordHost: string, discordPort: number;
  let craftingProxy: string, bpFactory: string;

  if (process.env.ZEET_ENVIRONMENT == 'main') {
    postgres = process.env.DATABASE_URL;
    redis = process.env.REDIS_URL;
    ticketHost = process.env.TICKET_SERVICE_HOST;
    ticketPort = parseInt(process.env.TICKET_SERVICE_PORT);
    userHost = process.env.USER_SERVICE_HOST;
    userPort = parseInt(process.env.USER_SERVICE_PORT);
    userApiToken = process.env.USER_SERVICE_API_TOKEN;
    twitchHost = process.env.TWITCH_SERVICE_HOST;
    twitchPort = parseInt(process.env.TWITCH_SERVICE_PORT);
    urlHost = process.env.URL_SERVICE_HOST;
    urlPort = parseInt(process.env.URL_SERVICE_PORT);
    discordHost = process.env.DISCORD_BOT_HOST;
    discordPort = parseInt(process.env.DISCORD_BOT_PORT);
    craftingProxy = process.env.CRAFTING_PROXY;
    bpFactory = process.env.BP_FACTORY;
  } else {
    postgres = process.env.DEV_DATABASE_URL;
    redis = process.env.DEV_REDIS_URL;
    ticketHost = process.env.DEV_TICKET_SERVICE_HOST;
    ticketPort = parseInt(process.env.DEV_TICKET_SERVICE_PORT);
    userHost = process.env.DEV_USER_SERVICE_HOST;
    userPort = parseInt(process.env.DEV_USER_SERVICE_PORT);
    userApiToken = process.env.DEV_USER_SERVICE_API_TOKEN;
    twitchHost = process.env.DEV_TWITCH_SERVICE_HOST;
    twitchPort = parseInt(process.env.DEV_TWITCH_SERVICE_PORT);
    urlHost = process.env.DEV_URL_SERVICE_HOST;
    urlPort = parseInt(process.env.DEV_URL_SERVICE_PORT);
    discordHost = process.env.DEV_DISCORD_BOT_HOST;
    discordPort = parseInt(process.env.DEV_DISCORD_BOT_PORT);
    craftingProxy = process.env.DEV_CRAFTING_PROXY;
    bpFactory = process.env.DEV_BP_FACTORY;
  }
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
      bpFactory,
      craftingProxy,
    },
    storage: {
      postgres,
      redis,
    },
    microservice: {
      twitch: {
        host: twitchHost,
        port: twitchPort,
        url: 'http://' + twitchHost + ':' + twitchPort,
      },
      discord: {
        host: discordHost,
        port: discordPort,
        url: 'http://' + discordHost + ':' + discordPort,
      },
      ticket: {
        host: ticketHost,
        port: ticketPort,
        url: 'http://' + ticketHost + ':' + ticketPort,
      },
      user: {
        host: userHost,
        port: userPort,
        url: 'http://' + userHost + ':' + userPort,
        token: userApiToken,
      },
      url: {
        host: urlHost,
        port: urlPort,
        url: 'http://' + urlHost + ':' + urlPort,
      },
    },
  };
  return config;
};
