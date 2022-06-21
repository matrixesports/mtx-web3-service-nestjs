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

admin:

- emergency: revoke access, change oracle,
- pass: new pass, addreward, setxp, changeOracle,
- oracle: givexp

# TODO:

- endpoint for what info we need for redeemable item, store it in directory metadata
- give fe option to redeem in 1 tx
  changelog:
- send msg to phone when error , add webhook for discord
- give option to redeem in 1 click or naw
- better copy for out
- prep checklist for fe to prep for be
- user starts at level 0 now

- validation,logging, security, auth, caching
- twilio
-

changelog:

- will refer to getPass as getSeason now

- make everytihing readable to send to otyhers
- runs at port 3000 now
- gotta change pass->season
- user starts at level 0 now
- removed tokenbundle and added erc1155
  -in PassReward bundle->reward, tokenBundle->ERC1155
- in pass, state, freerewards, if there is no reward then its left empty
