# Graphql service for talking to the contracts

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

- optimize
- add reward type to reward
- add metadata to inventrorey erc20
- //TODO: read from ticket db and convert to bytes32
- //TOD: PAGINATIION AND ALCHEMY ONLY SUPPORRS 20 contracts
  // TODO: throw error if contract doesnt exist for recipe; return null can be made better
  // TODO: TEST IT
  // //TODO: SETUP MORALIS DB TO LISTEN FOR EVENTS
- moralis
- dpd

  For level info: i return 0 id 0 qty for levels with no rewards OR skip those levels
  userINfo will juuts use context user address now
  Userinfo unclaimed will just return array of levels where rewards are unclaimed

TODO:

1. chaman endpoint for name,description in pass
