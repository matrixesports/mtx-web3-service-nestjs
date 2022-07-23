import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let message;
    let status;
    let code;
    switch (error.constructor) {
      case HttpException: 
        status = (error as HttpException).getStatus();
        message = (error as HttpException).message;
        code = status;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = "unregistered error!";
        code = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    response
      .status(status).
      json(GlobalResponseError(status, message, code, request));
  }
}

export const GlobalResponseError: (statusCode: number, message: string, code: string, request: Request) => IResponseError = (
    statusCode: number,
    message: string,
    code: string,
    request: Request
): IResponseError => {
    return {
        statusCode: statusCode,
        message,
        code,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method
    };
};

export interface IResponseError {
    statusCode: number;
    message: string;
    code: string,
    timestamp: string;
    path: string;
    method: string;
}