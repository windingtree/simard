import 'reflect-metadata';

import { bootstrapMicroframework } from 'microframework-w3tec';

import { banner } from './lib/banner';
import { expressLoader } from './loaders/expressLoader';
import { homeLoader } from './loaders/homeLoader';
import { iocLoader } from './loaders/iocLoader';
import { monitorLoader } from './loaders/monitorLoader';
import { publicLoader } from './loaders/publicLoader';
// import { swaggerLoader } from './loaders/swaggerLoader';
import { typeormLoader } from './loaders/typeormLoader';
import { winstonLoader } from './loaders/winstonLoader';
import {LoggerFactory} from './lib/logger';

/**
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 *
 * This is a boilerplate for Node.js Application written in TypeScript.
 * The basic layer of this app is express. For further information visit
 * the 'README.md' file.
 */
const log = LoggerFactory.createLogger('bootstrap');

bootstrapMicroframework({
    /**
     * Loader is a place where you can configure all your modules during microframework
     * bootstrap process. All loaders are executed one by one in a sequential order.
     */
    loaders: [
        winstonLoader,
        iocLoader,
        typeormLoader,
        expressLoader,
        monitorLoader,
        homeLoader,
        publicLoader,
    ],
})
    .then(() => banner(log))
    .catch((error: any) => {
        log.error('Application is crashed: ' + error);
        console.error(error.message);
        console.error(error);
    });
