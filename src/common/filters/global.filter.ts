import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Request, Response } from 'express';

@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const logger = new Logger(GlobalFilter.name);
    if (host.getType() === "http") {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse<Response>();
      const req = ctx.getRequest<Request>();
      let message: string;
      let status: number;
      switch (error.constructor) {
        case HttpException: 
          status = (error as HttpException).getStatus();
          message = (error as HttpException).message;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = "unregistered error!";
          logger.error(error);
      }
      res
      .status(status)
      .json({ 
        status, 
        message, 
      } as IResponseError);
    } else if (host.getType<GqlContextType>() === "graphql") {
      // stops nest built-in error logger 
      return error;
    }
  }
}

export interface IResponseError {
    status: number;
    message: string;
    sucess: false,
}