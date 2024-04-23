import {Container} from 'typedi';
import {Connection, createConnection, useContainer} from 'typeorm';

import {env} from '../../src/env';
import {upgrade} from '../../src/database/initscripts/MigrationScriptRunner';

declare type LoggerOptions = boolean | 'all' | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[];

export const createDatabaseConnection = async (): Promise<Connection> => {
    useContainer(Container);
    return await createConnection({
        type: env.db.type as any, // See createConnection options for valid types
        database: env.db.database,
        logging: env.db.logging as LoggerOptions,
        entities: env.app.dirs.entities,
        migrations: env.app.dirs.migrations,
        synchronize: true,
    });
};

export const synchronizeDatabase = async (connection: Connection) => {
    await connection.dropDatabase();
    return connection.synchronize(true);
};

export const migrateDatabase = async (connection: Connection) => {
    await connection.dropDatabase();
    // return connection.runMigrations();
};

export const closeDatabase = (connection: Connection) => {
    return connection.close();
};

export const restoreDatabaseWithTestScripts = async (dir: string) => {
    let connection;
    try {
        connection = await createDatabaseConnection();
        await connection.dropDatabase();
        // await connection.close();
        // setup db (non-test data);
        await upgrade(undefined);
        if (dir) {
            // additionally add test data
            await upgrade(dir);
        }
    } catch (err: any) {
        console.log('Error while setting up test database)');
    } finally {
        await connection.close();
    }
};
