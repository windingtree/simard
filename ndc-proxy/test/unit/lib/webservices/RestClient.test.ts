import {RestClient} from '../../../../src/lib/webservices/RestClient';
import * as sinon from 'sinon';
import {SinonStub} from 'sinon';
import axios from 'axios';
import {LogMock} from '../../../testutils/mocks/LogMock';

let axiosStub: SinonStub;

describe('RestClient.ts', () => {
    const log = new LogMock();
    let  restClient;
    const mockedResponse = {data: {name: 'some name'}};
    beforeAll(() => {
        axiosStub = sinon.stub(axios, 'get');
    });
    afterAll(() => {
        axiosStub.restore();
    });
    beforeEach(() => {
        restClient = new RestClient(log);
    });

    test('call with GET should use axios.get and return response.data object upon successful execution', async (done) => {
        axiosStub.withArgs('http://somedummyurl.com/').returns(mockedResponse);
        const response = await restClient.getCall('http://somedummyurl.com/', {}, 1000);
        expect(response).toEqual(mockedResponse.data);
        expect(axiosStub.calledOnce).toBeTruthy();
        done();
    });
    test('HTTPError should be thrown if axios fail to make a call', async (done) => {
        axiosStub.withArgs('http://somedummyurl.com/').throws('not available');
        try {
            await restClient.getCall('http://somedummyurl.com/', {}, 1000);
            fail('expected exception');
        } catch (err: any) {
            console.error(err);
        }
        done();
    });
});
