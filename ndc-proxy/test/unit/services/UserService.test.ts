import { User } from '../../../src/database/models/User';
import { UserService } from '../../../src/services/user/UserService';
import { events } from '../../../src/subscribers/events';
import { EventDispatcherMock } from '../../testutils/mocks/EventDispatcherMock';
import { LogMock } from '../../testutils/mocks/LogMock';
import { RepositoryMock } from '../../testutils/mocks/RepositoryMock';

describe('UserService', () => {

    test('Find should return a list of users', async (done) => {
        const log = new LogMock();
        const repo = new RepositoryMock();
        const ed = new EventDispatcherMock();
        const user = new User();
        user.firstName = 'John';
        user.lastName = 'Doe';
        user.email = 'john.doe@test.com';
        repo.list = [user];
        const userService = new UserService(repo as any, ed as any, log);
        const list = await userService.find();
        expect(list[0].firstName).toBe(user.firstName);
        done();
    });

    test('Create should dispatch subscribers', async (done) => {
        const log = new LogMock();
        const repo = new RepositoryMock();
        const ed = new EventDispatcherMock();
        const user = new User();
        user.firstName = 'John';
        user.lastName = 'Doe';
        user.email = 'john.doe@test.com';
        const userService = new UserService(repo as any, ed as any, log);
        const newUser = await userService.create(user);
        expect(ed.dispatchMock).toBeCalledWith([events.user.created, newUser]);
        done();
    });

});
