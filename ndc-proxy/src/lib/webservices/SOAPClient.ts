import axios from 'axios';
import {HttpRequestError} from './HttpRequestError';
import {LoggerFactory, logMessage} from '../logger';
import {logExecutionTime} from '../utils/logExecutionTime';

const DEFAULT_TIMEOUT = 200;

export class WebserviceDefinition {
    public webserviceName: string;
    public url: string;
    public soapAction?: string;
    public customHeaders?: any;
    public timeout: number;
    constructor(webserviceName: string, url: string, soapAction: string|undefined= undefined, customHeaders: any|undefined = undefined, timeout: number= DEFAULT_TIMEOUT ) {
        this.webserviceName = webserviceName;
        this.url = url;
        this.soapAction = soapAction;
        this.customHeaders = customHeaders;
        this.timeout = timeout;
    }
}

/**
 * Create a definition/configuration for a specific type of webservice call.
 * @param webserviceName  unique webservice request identifier
 * @param url webservice endpoint URL
 * @param soapAction Should SOAPAction header be specified - provide it's value as parameters
 * @param customHeaders Additional headers to be used
 * @param timeout Max time we should wait for a response from webservice (in millisec). If it's -1, default value will be used
 * @returns {{webserviceName, soapAction, url, customHeaders: {}, timeout: number}}
 */
export class SOAPClient {
    public static createHeaders(wbsConfig: WebserviceDefinition): any {
        const {soapAction: SOAPAction, customHeaders} = wbsConfig;
        const commonHeaders = {
            'Content-Type': 'application/xml;charset=UTF-8',
            'Accept-Encoding': 'gzip,deflate',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...(SOAPAction ? {SOAPAction} : {}),
        };
        return Object.assign({}, commonHeaders, customHeaders);
    }
    private log = LoggerFactory.createLogger('soap');
    private _webservices: WebserviceDefinition[];
    public constructor(webservices?: WebserviceDefinition[]) {
        this._webservices = webservices;
    }

    public async wbsRequest(webserviceName: string, request: string): Promise<any> {
        const wbsConfig = this.getWebserviceConfiguration(webserviceName);
        const {url, timeout: timeoutInSeconds} = wbsConfig;
        this.log.debug(`SOAP Request, url:${url}, webserviceID:${webserviceName}`);
        // Request connection timeouts can be handled via CancelToken only
        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();
        const timeout = setTimeout(() => source.cancel('Timeout'), timeoutInSeconds * 1000);
        let responseData;
        const headers = SOAPClient.createHeaders(wbsConfig);
        await logMessage(`SOAP_Call ${webserviceName}`, JSON.stringify({
            url,
            headers,
        }), 'json');

        try {
            await logExecutionTime(`Call to SOAP ${webserviceName} ${url}`, async () => {
                const response = await axios.post(url, request,
                    {
                        headers,
                        cancelToken: source.token, // Request timeout
                    });
                responseData = response.data;
            });
        } catch (error: any) {
            if (error.response && error.response.data) {
                await logMessage(`${webserviceName}-ERROR_RESPONSE`, JSON.stringify(error.response.data), 'xml');
            }
            if (axios.isCancel(error)) {
                this.log.error(`Timeout error while making SOAP request, url:${url}, webserviceID:${webserviceName}, error:${error.message}`);
                throw new HttpRequestError(`URL did not respond within maximum allowed time, ${error.message}`, url, error);
            } else {
                this.log.error(`Unknown error while making SOAP request, url:${url}, webserviceID:${webserviceName}, error:${error.message}`);
                this.log.error(`Request Headers:${JSON.stringify(headers)}`);
                throw new HttpRequestError(`Unknown error occurred, ${error.message}`, url, error);
            }
        } finally {
            clearTimeout(timeout);
        }
        // logger.debug(`SOAP Request completed, url:${url}, webserviceID:${webserviceName}`);
        return responseData;
    }

    protected lazyInitializeWebserviceDefinitions(): WebserviceDefinition[] {
        return undefined;
    }

    private getWebserviceConfiguration(webserviceName: string): WebserviceDefinition {
        if (!this._webservices) {
            this._webservices = this.lazyInitializeWebserviceDefinitions();
        }
        const wbsConfig = this._webservices.find(config => config.webserviceName === webserviceName);
        if (!wbsConfig) {
            throw new HttpRequestError(`Missing configuration for webservice ${webserviceName}`, `webserviceID:${webserviceName}`, undefined);
        }
        return wbsConfig;
    }
}
