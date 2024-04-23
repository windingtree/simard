import { Application } from 'express';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { createExpressServer } from 'routing-controllers';

import { env } from '../env';
import {RoutingControllersOptions} from 'routing-controllers/types/RoutingControllersOptions';

export const expressLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
    if (settings) {

        const routingControllersOptions: RoutingControllersOptions = {
            cors: {
                origin: 'https://simard.io',
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                preflightContinue: false,
                credentials: true,
            },
            classTransformer: true,
            routePrefix: env.app.routePrefix,
            defaultErrorHandler: false,
            /**
             * We can add options about how routing-controllers should configure itself.
             * Here we specify what controllers should be registered in our express server.
             */
            controllers: env.app.dirs.controllers,
            middlewares: env.app.dirs.middlewares,
            interceptors: env.app.dirs.interceptors,

            validation: {
                validationError: {
                    target: false,
                    value: false,
                },
            },
        };

        /**
         * We create a new express server instance.
         * We could have also use useExpressServer here to attach controllers to an existing express instance.
         */
        const expressApp: Application = createExpressServer(routingControllersOptions);

        // Run application to listen on given port
        if (!env.isTest) {
            const server = expressApp.listen(env.app.port);
            settings.setData('express_server', server);
        }
        // Here we can set the data for other loaders
        settings.setData('express_app', expressApp);
        settings.setData('routingControllersOptions', routingControllersOptions);
    }
};
