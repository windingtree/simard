import {RestClient} from '../../../src/lib/webservices/RestClient';

export class RestClientMock extends RestClient {
    public getMock = jest.fn();
    public responses = {};

    // mock for GET - it will return response stored in this.responses under key equal to 'url' parameter
    public async getCall(url: string, headers: any, timeoutInMillis: number): Promise<any> {
        this.getMock(url, timeoutInMillis);
        return Promise.resolve(this.responses[url]);
    }
}
