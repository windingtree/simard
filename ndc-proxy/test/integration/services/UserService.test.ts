/*
import { Container } from 'typedi';
import { Connection } from 'typeorm';

import { User } from '../../../src/database/models/User';
import { UserService } from '../../../src/services/user/UserService';
import { closeDatabase, createDatabaseConnection, migrateDatabase } from '../../testutils/database';
import { configureLogger } from '../../testutils/logger';

describe('UserService', () => {

    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    let connection: Connection;
    beforeAll(async () => {
        configureLogger();
        connection = await createDatabaseConnection();
    });
    beforeEach(() => migrateDatabase(connection));

    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    test('should create a new pet in the database', async (done) => {
        const user = new User();
        user.firstName = 'firstName';
        user.lastName = 'lastName';
        user.email = 'test@test.com';
        user.username = 'userXYZ';
        user.password = 'pass';
        const service = Container.get<UserService>(UserService);
        const resultCreate = await service.create(user);
        expect(resultCreate.username).toBe(user.username);
        expect(resultCreate.email).toBe(user.email);
        const resultFind = await service.findOne(resultCreate.id.toString());
        if (resultFind) {
            expect(resultFind.username).toBe(user.username);
            expect(resultFind.email).toBe(user.email);
        } else {
            fail('Could not find pet');
        }
        done();
    });

});
*/
