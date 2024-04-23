import {performance} from 'perf_hooks';
import {LoggerFactory} from '../logger';

const logger = LoggerFactory.createLogger('execution measurement');
export const logExecutionTime = async (message: string, callback: () => any) => {
    const startTime = performance.now();
    await callback();
    const endTime = performance.now();
    logger.info(`Performance measurement of ${message}, execution time: ${endTime - startTime}ms`);
};
