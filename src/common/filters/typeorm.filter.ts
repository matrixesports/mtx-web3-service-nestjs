import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { Request, Response } from 'express';
import { GlobalResponseError } from './global.filter';


// full list of error https://github.com/typeorm/typeorm/tree/master/src/error
@Catch(QueryFailedError, EntityNotFoundError)
export class TypeORMFilter implements ExceptionFilter {
    catch(error: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message;
        let code;
        switch (error.constructor) {
            case QueryFailedError: 
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = (error as QueryFailedError).message;
                code = (error as any).code;
                break;
            case EntityNotFoundError:
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = (error as EntityNotFoundError).message;
                code = (error as any).code;
                break;
            default:
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = "unregistered error!";
                code = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        response.status(status).json(GlobalResponseError(status, message, code, request));
    }
}