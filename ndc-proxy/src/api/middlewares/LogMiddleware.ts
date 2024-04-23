import * as express from 'express';
import morgan from 'morgan';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';

import { env } from '../../env';
import {LoggerFactory} from '../../lib/logger';

@Middleware({ type: 'before' })
export class LogMiddleware implements ExpressMiddlewareInterface {

    private log = LoggerFactory.createLogger('REST calls logging middleware');

    public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
        return morgan(env.log.output, {
            stream: {
                write: this.log.info.bind(this.log),
            },
        })(req, res, next);
    }

}
