import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

//https://github.com/iamolegga/nestjs-pino/blob/master/src/LoggerErrorInterceptor.ts
@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) => {
        return throwError(() => {
          let logger = new Logger("ErrorLogger");
          logger.error(error);
          const response = context.switchToHttp().getResponse();          
          if (codes.includes(error?.code)) {
            let newerr = new EthersException(
              error.message,
              error.stack,
              error.reason,
              error.code,
              error.error,
            ) 
            response.err = newerr;
            return newerr;
          }
          return error;
        });
      }),
    );
  }
}

export class EthersException extends Error {
  constructor(
    message: string,
    private readonly trace: Record<string, any>,
    private readonly reason: string,
    private readonly code: string,
    private readonly error: Record<string, any>
    ) {
      super(message);
    }
}

// TODO:
// provider errors (url == polygon) 
// contract errors (revets, typechain may generate revert reasosn ?) 
// recursive error transofrmation [ethers wraps error from polygon which wraps contract revert]

// https://docs.ethers.io/v5/api/utils/logger/#errors
const codes = [
  "NOT_IMPLEMENTED",
  "SERVER_ERROR", 
  "TIMEOUT", 
  "UNKNOWN_ERROR", 
  "UNSUPPORTED_OPERATION",
  "BUFFER_OVERRUN",
  "NUMERIC_FAULT",
  "INVALID_ARGUMENT",
  "MISSING_ARGUMENT",
  "MISSING_NEW",
  "UNEXPECTED_ARGUMENT",
  "CALL_EXCEPTION",
  "INSUFFICIENT_FUNDS",
  "NETWORK_ERROR",
  "NONCE_EXPIRED",
  "REPLACEMENT_UNDERPRICED",
 "TRANSACTION_REPLACED",
 "UNPREDICTABLE_GAS_LIMIT",
]
