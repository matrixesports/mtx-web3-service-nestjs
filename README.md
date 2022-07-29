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
## Development 
### Error Handling and Logging
Services should throw logical errors, agnostic of the transport layer. Controllers should catch recoverable errors; otherwise, the filters handle the uncaught errors and send a response in the form `IResponseError`. Resolvers catch recoverable errors; otherwise, the plugin handles the uncaught errors and sends the `{success: false}`. 
The ErrorInterceptor logs and transforms uncaught errors before passing them to the filters and gql error plugin. If you catch an error, you must transform and log it. 