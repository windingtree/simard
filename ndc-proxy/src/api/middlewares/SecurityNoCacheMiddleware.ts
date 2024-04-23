import * as express from 'express';
import * as nocache from 'nocache';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';

@Middleware({ type: 'before' })
export class SecurityNoCacheMiddleware implements ExpressMiddlewareInterface {

    public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
        return nocache.default()(req, res, next);
    }

}
