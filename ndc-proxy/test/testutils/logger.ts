import { configure, transports } from 'winston';

/**
 * Configure logger
 */
export const configureLogger = () => {
    configure({
        transports: [
            new transports.Console({
                level: 'debug',
                handleExceptions: false,
            }),
        ],
    });
};
