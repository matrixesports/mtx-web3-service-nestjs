import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { IResponseError } from './global.filter';
import { EthersException } from '../interceptors/errorr.interceptor';


@Catch(EthersException)
export class EthersFilter implements ExceptionFilter {
    catch(error: EthersException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();
        res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ 
          status: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: "on-chain error", 
          path: req.url, 
          method: req.method } as IResponseError);
    }
}