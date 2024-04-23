import { env } from '../env';
import {LoggerFactory} from './logger';

const log = LoggerFactory.createLogger('bootstrap');

export function banner(logger: any): void {
    if (env.app.banner) {
        const route = () => `${env.app.schema}://${env.app.host}:${env.app.port}`;
        log.info(`Aloha, your app is ready on ${route()}${env.app.routePrefix}`);
        log.info(`Environment  : ${env.node}`);
    } else {
        log.info(`Application is up and running.`);
    }
}
