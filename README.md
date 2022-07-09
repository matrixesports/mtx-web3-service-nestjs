# Graphql service for querying the contracts

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

- //TODO: read from ticket db and convert to bytes32
- //TOD: PAGINATIION AND ALCHEMY ONLY SUPPORRS 20 contracts
  // TODO: throw error if contract doesnt exist for recipe; return null can be made better
  // TODO: TEST IT
  // //TODO: SETUP MORALIS DB TO LISTEN FOR EVENTS
- moralis
- dpd

  For level info: i return 0 id 0 qty for levels with no rewards OR skip those levels i return null
  userINfo will juuts use context user address now
  Userinfo unclaimed will just return array of levels where rewards are unclaimed

TODO:

BO:

- add middleware to context to automatically convert incoming into nice checksum addresses in the context
- add logging middleware
- datadog, talk to jay
- exception handlers, proper error handling and how would we look at errors that happen once they have happened?
- pipes for api calls?
- caching
- adjust for page keys in alchemy api

BATTLE_PASS:

1. chaman endpoint for name,description in pass
2. user service url for .env
3. better eror handline that returning null and shit
4. inventory read from ticket db

- pass contract add info for creator token and betterhanling of IDS
- document everythng
- FINAL. THINK
- add reward check type
  contarcts should not allow for mistakes and FE shouldnt have to worry
