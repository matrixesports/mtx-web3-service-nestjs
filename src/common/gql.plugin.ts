import { Plugin } from '@nestjs/apollo';
import { GraphQLRequestContext } from 'apollo-server-core';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Plugin()
export class GraphQLPlugin implements ApolloServerPlugin {
  constructor(
    @InjectPinoLogger()
    private readonly logger: PinoLogger,
  ) {}
  async requestDidStart(
    ctx: GraphQLRequestContext,
  ): Promise<GraphQLRequestListener> {
    if (ctx.request.operationName === 'IntrospectionQuery') {
      return;
    }
    ctx.logger = this.logger.logger.child({ context: 'GraphQLLogger' });
    return new Listener({}) as unknown as GraphQLRequestListener;
  }
}

class Listener<T = unknown>
  implements
    Pick<GraphQLRequestListener<T>, 'didEncounterErrors' | 'willSendResponse'>
{
  private readonly start: number;
  constructor(private readonly logData: Record<string, unknown>) {
    this.start = Date.now();
  }

  async willSendResponse(ctx: GraphQLRequestContext) {
    if (ctx?.errors && ctx.operation.operation === 'mutation') {
      ctx.response.data = { success: false };
    } else {
      ctx.logger.info({
        operationName: ctx.request.operationName,
        query: ctx.request.query,
        variables: ctx.request.variables,
        duration: Date.now() - this.start,
      });
    }
  }
}
