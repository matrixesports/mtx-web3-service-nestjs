import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { timestamp } from 'rxjs';

@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
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
    }
    
    res
      .status(status)
      .json({ 
        status, 
        message, 
        timestamp: new Date().toISOString(), 
        path: req.url, 
        method: req.method } as IResponseError);
  }
}

export interface IResponseError {
    status: number;
    message: string;
    timestamp: string;
    path: string;
    method: string;
}