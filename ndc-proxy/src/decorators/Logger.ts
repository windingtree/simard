import { Container } from 'typedi';

import {LoggerFactory} from '../lib/logger';

export function Logger(scope: string, customLabels: any = undefined): ParameterDecorator {
    return (object, propertyKey, index): any => {
        // const logger = new WinstonLogger(scope);
        const logger = LoggerFactory.createLogger(scope, customLabels);
        const propertyName = propertyKey ? propertyKey.toString() : '';
        // console.log(`@Logger(${scope}) registering, propertyName:${propertyName}, index:${index}`);
        Container.registerHandler({ object, propertyName, index, value: () => logger });
    };
}

export { LoggerInterface } from '../lib/logger';
