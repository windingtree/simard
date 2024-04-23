import * as express from 'express';
import {ExpressErrorMiddlewareInterface, Middleware} from 'routing-controllers';

import { env } from '../../env';
import {LoggerFactory} from '../../lib/logger';
// import {BaseGliderException} from '../errors/BaseGliderException';
export const DEFAULT_ERROR_CODE = 'E01';

@Middleware({ type: 'after' })
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
    public isProduction = env.isProduction;
    private log = LoggerFactory.createLogger('error handler middleware');

    public error(error: any, req: express.Request, res: express.Response, next: express.NextFunction): void {
        const message = error.message;
        const details = error[`errors`] || [];
        let code;
        if (error && error.errorCode) {
            // normally all thrown exceptions from Glider should be here
            code = error.errorCode;
        } else {
            code = DEFAULT_ERROR_CODE;
        }

        const statusCode = error.httpCode || 500;
        const response = {
            code,
            message,
            details,
        };
        this.log.error(`Error captured, error:${error.name}, message:${this.isProduction ? error.message : error.stack}, details:${details}`);
        res.status(statusCode);
        res.json(response);
        this.log.error(`Error response to client:${JSON.stringify(response)}, http status code:${statusCode}`);
    }

}
