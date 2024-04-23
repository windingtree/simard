import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { configure, format, transports } from 'winston';
// import { ElasticsearchTransport } from 'winston-elasticsearch';
import LokiTransport from 'winston-loki';

import { env } from '../env';

export const winstonLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
    configure({
        transports: [
            new transports.Console({
                level: 'debug',
                handleExceptions: true,
                format: env.node !== 'development'
                    ? format.combine(
                        format.json()
                    )
                    : format.combine(
                        format.colorize(),
                        format.simple()
                    ),
            }),
            new LokiTransport({
                level: 'debug',
                host: env.log.grafana_url,
                json: true,
                basicAuth: env.log.grafana_auth,
                labels: { job: 'ndc-proxy-qa' },
            }),
        ],
    });
};
