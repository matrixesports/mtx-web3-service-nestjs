import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import { GraphQLRequestContext } from 'apollo-server-core';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContextDidEncounterErrors,
} from 'apollo-server-plugin-base';

@Plugin()
export class GraphQLLogger implements ApolloServerPlugin {
  private readonly logger = new Logger(GraphQLLogger.name);

  async requestDidStart(startCtx: GraphQLRequestContext): Promise<GraphQLRequestListener> {
    return new Listener(
      {
        operationName: startCtx.request.operationName,
        query: startCtx.request.query,
        variables: startCtx.request.variables,
      },
      this.logger,
    ) as unknown as GraphQLRequestListener;
  }
}

class Listener<T = unknown>implements
  Pick<GraphQLRequestListener<T>, 'didEncounterErrors' | 'willSendResponse'>
{
  private readonly start: number;

  constructor(
    private readonly logData: Record<string, unknown>,
    private readonly logger: Logger,
  ) {
    this.start = Date.now();
  }

  async didEncounterErrors(
    errorsCtx: GraphQLRequestContextDidEncounterErrors<T>,
  ): Promise<void> {
    this.logData.errors = errorsCtx.errors;
  }

  async willSendResponse(startCtx: GraphQLRequestContext): Promise<void> {
    this.logData["response"] = startCtx.response.data;
    this.logger.log(
      {
        graphql: this.logData,
        responseTime: Date.now() - this.start,
      },
      this.logData.errors ? 'request errored' : 'request completed',
    );
  }
}