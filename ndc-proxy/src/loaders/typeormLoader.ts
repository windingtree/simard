import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { createConnection, getConnectionOptions } from 'typeorm';

import { env } from '../env';
import fs from 'fs';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {

    const loadedConnectionOptions = await getConnectionOptions();

    const connectionOptions = Object.assign(loadedConnectionOptions, {
        type: env.db.type as any, // See createConnection options for valid types
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
        synchronize: env.db.synchronize,
        logging: env.db.logging,
        entities: env.app.dirs.entities,
        migrations: env.app.dirs.migrations,
        ssl: env.db.useSSL, // `true` or `false`,
        sslCA: env.db.sslCA && env.db.useSSL ? [fs.readFileSync(env.db.sslCA)] : undefined,
    });
    // console.log('Connection options:', connectionOptions);
    const connection = await createConnection(connectionOptions);

    if (settings) {
        settings.setData('connection', connection);
        settings.onShutdown(() => connection.close());
    }
};
