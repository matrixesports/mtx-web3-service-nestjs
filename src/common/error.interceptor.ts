import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorCode as codes } from '@ethersproject/logger';
import { EthersException } from './filters';
import { GraphQLError } from 'graphql';

//https://github.com/iamolegga/nestjs-pino/blob/master/src/LoggerErrorInterceptor.ts
@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  logger = new Logger(ErrorInterceptor.name);
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) =>
        throwError(() => {
          // const response = context.switchToHttp().getResponse();
          if (error?.code in codes) return this.parseEthersError(error, this.logger);
          else this.logger.error(error);
          return error;
        }),
      ),
    );
  }

  parseEthersError(error: any, logger: Logger) {
    if (error.error?.code in codes) {
      if (error.error.error?.code in codes) {
        const newerr = new EthersException(
          error.error.error.reason,
          error.error.error.stack,
          error.error.error.code,
          error.error.error.url
            ? {
                requestBody: error.error.error.requestBody,
                body: error.error.error.body,
              }
            : undefined,
          error.error.error.error,
        );
        error.error.error = newerr;
      }
      const newerr = new EthersException(
        error.error.reason,
        error.error.stack,
        error.error.code,
        error.error.transaction
          ? {
              transaction: error.error.transaction,
              method: error.error.method,
            }
          : undefined,
        error.error.error,
      );
      error.error = newerr;
    }
    const newerr = new EthersException(
      error.reason,
      error.stack,
      error.code,
      undefined,
      error.error,
    );
    logger.error(newerr);
    return newerr;
  }
}

export const REDEEM_TICKET_ERROR = 'REDEEM_TICKET_ERROR';
