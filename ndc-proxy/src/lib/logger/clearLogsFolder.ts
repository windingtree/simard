import fs from 'fs';
import { join } from 'path';
import {env} from '../../env';

export const clearLogsFolder = async (): Promise<void> => {
    fs.readdir(env.app.dirs.logs, (err, files) => {
        if (err) { throw err; }

        for (const file of files) {
            fs.unlink(join(env.app.dirs.logs, file), error => {
                if (error) { throw error; }
            });
        }
    });
};
