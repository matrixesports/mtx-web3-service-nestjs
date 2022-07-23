import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { Request, Response } from 'express';
import { IResponseError } from './global.filter';


// full list of error https://github.com/typeorm/typeorm/tree/master/src/error
@Catch(QueryFailedError, EntityNotFoundError)
export class TypeORMFilter implements ExceptionFilter {
    catch(error: Error, host: ArgumentsHost) {
        const logger = new Logger(TypeORMFilter.name);
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();
        let message: string;
        let status: number;
        switch (error.constructor) {
            case QueryFailedError: 
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = (error as QueryFailedError).message;
                logger.warn(error);
                break;
            case EntityNotFoundError:
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = (error as EntityNotFoundError).message;
                logger.warn(error);
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
          timestamp: new Date().toISOString(), 
          path: req.url, 
          method: req.method } as IResponseError);
    }
}