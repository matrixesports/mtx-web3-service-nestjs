import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ErrorCode as codes } from "@ethersproject/logger";

//https://github.com/iamolegga/nestjs-pino/blob/master/src/LoggerErrorInterceptor.ts
@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) => throwError(() => {
        let logger = new Logger(ErrorInterceptor.name);
        const response = context.switchToHttp().getResponse();       
        if (error?.code in codes) {
          let newerr = new EthersException(
            error.message,
            error.stack,
            error.reason,
            error.code,
            error.error,
          ) 
          logger.error(newerr);
          return newerr;
        }
        logger.error(error);
        return error;
    })))
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
