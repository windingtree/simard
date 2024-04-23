import {Service} from 'typedi';
import axios from 'axios';
import {HttpRequestError} from './HttpRequestError';
import {LoggerFactory, logMessage, safeJsonStringify} from '../logger';
import {logExecutionTime} from '../utils/logExecutionTime';

enum Method {
    POST= 'POST',
    GET= 'GET',
    DELETE= 'DELETE',
}
/**
 * Class to be used as a REST client
 *
 */
@Service()
export class RestClient {
    private log = LoggerFactory.createLogger('rest');
    /**
     * Make a GET call to an endpoint and return JSON
     * @param url url to make a call to
     * @param timeoutInMillis timeout(ms) after which call will be cancelled
     * @throws HttpRequestError thrown in case of failure
     */
    public async getCall<T>(url: string, headers: any, timeoutInMillis: number): Promise<T> {
        this.log.debug(`GET ${url}`);
        return this.axiosCall<T>(Method.GET, url, undefined, headers, timeoutInMillis);
    }

    /**
     * Make a POST call to an endpoint and return JSON
     * @param url url to make a call to
     * @param body request body (JSON)
     * @param timeoutInMillis timeout(ms) after which call will be cancelled
     * @throws HttpRequestError thrown in case of failure
     */
    public async postCall<T>(url: string, headers: any, body: any, timeoutInMillis: number): Promise<T> {
        this.log.debug(`POST ${url}`);
        return this.axiosCall<T>(Method.POST, url, body, headers, timeoutInMillis);
    }

    public async deleteCall<T>(url: string, headers: any, timeoutInMillis: number): Promise<T> {
        this.log.debug(`DELETE ${url}`);
        return this.axiosCall<T>(Method.DELETE, url, undefined, headers, timeoutInMillis);
    }

    private async axiosCall<T>(method: Method, url: string, body: any, headers: any, timeoutInMillis: number): Promise<T> {
        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();
        const timeout = setTimeout(() => source.cancel('Timeout'), timeoutInMillis);
        const config = {
            cancelToken: source.token,
            headers,
        };
        const data = body ? body : {};
        let result: T;
        try {
            let response;
            await logExecutionTime(`Call to ${method} ${url}`, async () => {
                switch (method) {
                    case Method.GET:
                        response = await axios.get(url, config);
                        break;
                    case Method.POST:
                        response = await axios.post(url, data, config);
                        break;
                    case Method.DELETE:
                        response = await axios.delete(url, config);
                        break;
                    default:
                        this.log.error(`Unsupported method:${method}`);
                }
                result = response.data as T;
            });
        } catch (error: any) {
            this.log.warn(`Failed to make a ${method} call to url ${url}, error:${error.message}`);
            if (axios.isCancel(error)) {
                throw new HttpRequestError(`URL did not respond within maximum allowed time, ${error.message}`, url, error);
            } else {
                let responseBody = '';
                if (error.response && error.response.data) {
                    responseBody = JSON.stringify(error.response.data).substring(0, 100);
                    await logMessage('rest_call_error', safeJsonStringify(error.response.data), 'json');
                    this.log.warn(`Error from server:${safeJsonStringify(error.response.data)}, Request payload:${safeJsonStringify(data)}`);
                }
                throw new HttpRequestError(`REST call error occurred, ${error.message};${responseBody}`, url, error);
            }
        } finally {
            clearTimeout(timeout);
        }
        return result;
    }

}
