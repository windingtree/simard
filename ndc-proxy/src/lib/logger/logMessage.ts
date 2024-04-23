import {env} from '../../env';
import moment from 'moment';
import fs from 'fs';
import path from 'path';

export const logMessage = async (fName: string, message: string, extension: string = 'xml'): Promise<void> => {
    const level = env.log.level || 'info';
    if (level.toLowerCase() === 'trace') {
        fs.writeFileSync(path.join(env.app.dirs.logs, `${fName}-${moment().toISOString()}.${extension}`), message);
    }

};

export const safeJsonStringify = (msg: any): string => {
    try {
        return JSON.stringify(msg);
    } catch (e) {
        return `[Unable to stringify JSON] ${msg}`;
    }
};
