/*
import {glob} from 'glob';
import path from 'path';
import mongo, {Db, MongoClient} from 'mongodb';
import {env} from '../../env';
import {LoggerFactory} from '../../lib/logger/LoggerFactory';

const log = LoggerFactory.createLogger(__filename);

export abstract class MigrationScriptRunner {
public derbysoft; public SOAP; public integration;
    public abstract upgrade(db: Db): Promise<any>;
    public abstract downgrade(db: Db): Promise<any>;
}

export interface MigrationScript {
    fileName: string;
    className: string;
    classInstance: MigrationScriptRunner;
}

/!**
 * Connect to mongo, use database and return db handle
 *!/
export async function getDatabaseConnection(host: string, port: number, dbName: string, username: string, password: string): Promise<MongoClient> {
    const url = `mongodb://${host}:${port}`;
    try {
        // Connection URL
        return await mongo.MongoClient.connect(url, {useNewUrlParser: true});
        // await client.db('admin').command({ ping: 1 });
        // return client.db(dbName);
    } catch (err: any) {
        const message = `Failed to connect to a database, URL:[${url}], db:[${dbName}], error:${err.message}`;
        throw new Error(message);
    }
}

/!**
 * Create new instance of a class extending MigrationScriptRunner (db upgrade/downgrade script)
 * @param clazz
 * @throws error if creation fails
 *!/
function createMigrationScriptRunnerInstance(clazz: any): MigrationScriptRunner {
    try {
        const instance = new clazz();
        return instance as MigrationScriptRunner;
    } catch (err: any) {
        throw new Error(`Cannot instantiate db migration script: ${err.message}`);
    }
}

/!**
 * Load all classes that implement MigrationScriptRunner from a given file & results of 'require'
 * @param filename
 * @param exports results of 'require'
 *
 *!/
function loadAndInstantiateMigrationScripts(filename: string, exports: any): MigrationScript[] {
    const results: MigrationScript[] = [];
    Object.keys(exports).forEach(key => {
        const obj = exports[key];
        if (obj.prototype instanceof MigrationScriptRunner) {
            const instance: MigrationScriptRunner = createMigrationScriptRunnerInstance(obj);
            results.push({
                fileName: filename,
                className: obj.name,
                classInstance: instance,
            });
        }
    });
    return results;
}

const byFileAndClassComparator = (a: MigrationScript, b: MigrationScript): number => {
    const fileCmp = a.fileName.localeCompare(b.fileName);
    if (fileCmp !== 0) {
        return fileCmp;
    }
    return a.className.localeCompare(b.className);
};

function sortMigrationScriptsForUpgrade(scripts: MigrationScript[]): MigrationScript[] {
    return [...scripts].sort(byFileAndClassComparator);
}

function sortMigrationScriptsForDowngrade(scripts: MigrationScript[]): MigrationScript[] {
    return [...scripts].sort(byFileAndClassComparator).reverse();
}

function loadDatabaseMigrationScriptsFromDir(dir: string): MigrationScript[] {
    const matchingFiles = glob.sync(dir);
    const scripts: MigrationScript[] = [];
    matchingFiles.map(file => {
        const req = require(file);
        const fileScripts: MigrationScript[] = loadAndInstantiateMigrationScripts(path.basename(file), req);
        scripts.push(...fileScripts);
    });
    scripts.sort(byFileAndClassComparator);
    return scripts;
}

/!**
 * Find DB upgrade scripts and execute them on a database configured in .evn.
 * If 'dir' parameter is specified, scripts from that folder will be used. Otherwise scripts from .env (TYPEORM_MIGRATIONS) will be used
 * @param dir Folder with db migration scripts (Optional)
 *!/

export async function upgrade(dir: string | undefined): Promise<void> {
    console.log('upgrade');
    const client = await getDatabaseConnection(env.db.host, env.db.port, env.db.database, env.db.username, env.db.password);
    await client.db('admin').command({ping: 1});
    const database = await client.db(env.db.database);
    const migrationScripts: string[] = dir ? [dir] : env.app.dirs.migrations;
    await migrate(database, migrationScripts, true);
    await client.close();
}

/!*export async function downgrade(dir: string|undefined): Promise<void> {
    const database = await getDatabaseConnection(env.db.host, env.db.port, env.db.database, env.db.username, env.db.password);
    const migrationScripts: string[] = dir ? [dir] : env.app.dirs.migrations;
    // await migrate(database, migrationScripts, false);
}*!/

async function migrate(database: Db, dirs: string[], isUpgrade: boolean): Promise<void> {
    let scripts: MigrationScript[] = [];
    console.log('migrate');
    try {
        dirs.forEach(dir => {
            scripts.push(...loadDatabaseMigrationScriptsFromDir(dir));
        });

        if (isUpgrade) {
            scripts = sortMigrationScriptsForUpgrade(scripts);
        } else {
            scripts = sortMigrationScriptsForDowngrade(scripts);
        }

    } catch (err: any) {
        log.error(`Failed to load and instantiate migration scripts, ${err.message}`);
        return;
    }
    let script;
    try {
        for (script of scripts) {
            log.info(`Executing db migration script: ${script.fileName}`);
            if (isUpgrade) {
                await script.classInstance.upgrade(database);
            } else {
                await script.classInstance.downgrade(database);
            }
        }
    } catch (err: any) {
        log.error(`Failed to execute migration script ${script.fileName}, ${err.message}`);
        return;
    }
}
*/
