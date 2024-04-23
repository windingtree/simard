import { Logger, format, transports, createLogger} from 'winston';

import {env} from '../../env';
import path, {join} from 'path';
import LokiTransport from 'winston-loki';

export class LoggerFactory {
    public static createLogger(scope: string, customLabels: any = undefined): Logger {
        // console.log(`LoggerFactory::createLogger(${scope}), LoggerFactory.isConfigured , log level:${env.log.level}, env.node=${env.node}`);
        // if (!LoggerFactory.isConfigured) {
        const logger = createLogger({level: 'debug'});
        const currentLogLevel = (env.log.level || 'info').toLowerCase();
        logger.add(
            new transports.File({ filename: join(env.app.dirs.logs, 'journal.log'), level: currentLogLevel })
        );
        logger.add(
            new transports.Console({
                handleExceptions: true,
                format: env.node !== 'development' ?
                    format.combine(format.json())
                    : format.combine(format.colorize(), format.simple()),
                level: currentLogLevel,
            })
        );
        const lokiLabels = Object.assign({}, {
            scope: LoggerFactory.parsePathToScope(scope),
            app: env.app.name,
            environment: env.app.env,
        }, customLabels || {});
        logger.add(
            new LokiTransport({
                host: env.log.grafana_url,
                json: true,
                basicAuth: env.log.grafana_auth,
                labels: lokiLabels,
            })
        );
        return logger;
    }
    // private static isConfigured = false;
    private static parsePathToScope(filepath: string): string {
        if (filepath.indexOf(path.sep) >= 0) {
            filepath = filepath.replace(process.cwd(), '');
            filepath = filepath.replace(`${path.sep}src${path.sep}`, '');
            filepath = filepath.replace(`${path.sep}dist${path.sep}`, '');
            filepath = filepath.replace('.ts', '');
            filepath = filepath.replace('.js', '');
            filepath = filepath.replace(path.sep, ':');
        }
        return filepath;
    }
}
