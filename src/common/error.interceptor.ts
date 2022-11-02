import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
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
          if (error.constructor.name == Warn.name) {
            this.logger.warn(error);
          } else if (error?.code in codes)
            return this.parseEthersError(error, this.logger);
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

// user facing errors
export class Warn extends GraphQLError {
  constructor(message: string) {
    super(message);
  }
}

export class InventoryError extends Error {
  constructor() {
    super('Inventory Failure!');
  }
}

export class LevelInfoError extends Error {
  constructor() {
    super('BattlePass Info Failure!');
  }
}

export class ClaimRewardError extends Error {
  constructor() {
    super('Claim Reward Failure!');
  }
}

export class MintError extends Error {
  constructor() {
    super('Mint Asset Failure!');
  }
}

export class BurnError extends Error {
  constructor() {
    super('Burn Asset Failure!');
  }
}
