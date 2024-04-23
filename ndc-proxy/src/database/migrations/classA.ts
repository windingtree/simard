/*
import {MigrationScriptRunner} from '../initscripts/MigrationScriptRunner';
import {Db} from 'mongodb';

export class X1 extends MigrationScriptRunner {

    constructor() {
        super();
        console.log('Class X1 is constructed');
    }
    public async upgrade(db: Db): Promise<any> {
        await db.createCollection('X1');
    }

    public async downgrade(db: Db): Promise<any> {
        await db.dropCollection('X1');
    }
}

export class A1 extends MigrationScriptRunner {

    constructor() {
        super();
        console.log('Class A1 is constructed');
    }
    public async upgrade(db: Db): Promise<any> {
        await db.createCollection('A1');
    }

    public async downgrade(db: Db): Promise<any> {
        await db.dropCollection('A1');
    }

}

export class A2 extends MigrationScriptRunner {
    constructor() {
        super();
        console.log('Class A2 is constructed');
    }
    public async upgrade(db: Db): Promise<any> {
        await db.createCollection('A2');
    }

    public async downgrade(db: Db): Promise<any> {
        await db.dropCollection('A2');
    }
}
*/
