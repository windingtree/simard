import {configureLogger} from './logger';

/**
 * Utility to setup dependency injection, configure loggers and perform other common setup/bootstraping activities that are needed prior unit test execution
 */

export const bootstrapDIContext = () => {
    configureLogger();
};
