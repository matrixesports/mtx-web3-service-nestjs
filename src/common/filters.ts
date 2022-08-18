import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

export interface IResponseError {
  message: string;
  success?: boolean;
}

export class EthersException extends Error {
  constructor(
    message: string,
    stack: string,
    private readonly code: string,
    private readonly context?: Record<string, any>,
    private readonly error?: Record<string, any>,
  ) {
    super(message);
    this.stack = stack;
  }
}

@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse<Response>();
      // const req = ctx.getRequest<Request>();
      let message: string;
      let status: number;
      switch (error.constructor) {
        case HttpException:
          status = (error as HttpException).getStatus();
          message = (error as HttpException).message;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'unregistered error!';
      }
      res.status(status).json({
        message: message,
      } as IResponseError);
    } else if (host.getType<GqlContextType>() === 'graphql') {
      // stops nest built-in error logger
      return error;
    }
  }
}

@Catch(EthersException)
export class EthersFilter implements ExceptionFilter {
  catch(error: EthersException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    // const req = ctx.getRequest<Request>();
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'on-chain error', // more info can be given base on error type
      success: false,
    } as IResponseError);
  }
}

// full list of error https://github.com/typeorm/typeorm/tree/master/src/error
@Catch(QueryFailedError, EntityNotFoundError)
export class TypeORMFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    // const req = ctx.getRequest<Request>();
    let message: string;
    let status: number;
    switch (error.constructor) {
      case QueryFailedError:
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (error as QueryFailedError).message;
        break;
      case EntityNotFoundError:
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (error as EntityNotFoundError).message;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'unregistered error!';
    }
    res.status(status).json({
      message,
    } as IResponseError);
  }
}
