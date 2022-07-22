import { Plugin } from '@nestjs/apollo';
import { GraphQLRequestContext } from 'apollo-server-core';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContextDidEncounterErrors,
} from 'apollo-server-plugin-base';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Plugin()
export class GraphQLLogger implements ApolloServerPlugin {
  constructor(
    @InjectPinoLogger()
    private readonly logger: PinoLogger
  ) {}
  async requestDidStart(gqlCtx: GraphQLRequestContext): Promise<GraphQLRequestListener> {
    // no logs for schema polling
    if (gqlCtx.request.operationName === "IntrospectionQuery") {
      return;
    }
    gqlCtx.logger = this.logger.logger.child({context: "GraphQLLogger"});
    return new Listener(
      {
        operationName: gqlCtx.request.operationName,
        query: gqlCtx.request.query,
        variables: gqlCtx.request.variables,
      }
    ) as unknown as GraphQLRequestListener;
  }
}

class Listener<T = unknown>implements
  Pick<GraphQLRequestListener<T>, 'didEncounterErrors' | 'willSendResponse'>
{
  private readonly start: number;
  constructor(
    private readonly logData: Record<string, unknown>,
  ) {
    this.start = Date.now();
  }

  async didEncounterErrors(
    gqlCtx: GraphQLRequestContextDidEncounterErrors<T>,
  ): Promise<void> {
    this.logData.errors = gqlCtx.errors;
    gqlCtx.logger.error({ graphql: this.logData });
  }

  async willSendResponse(gqlCtx: GraphQLRequestContext): Promise<void> {
    if (this.logData.errors) {
      return;
    }
    this.logData["response"] = gqlCtx.response.data;
    gqlCtx.logger.info(
      {
        graphql: this.logData,
        responseTime: Date.now() - this.start,
      },
    );
  }
}