import {FarelogixConfiguration} from '../../../env';
import {FarelogicWebserviceClient} from '../client/FarelogicWebserviceClient';

export class BaseFareLogixOperationClient {
    get flxConfig(): FarelogixConfiguration {
        return this._flxConfig;
    }

    /**
     * Return traceID - identifier used to track requests/responses on farelogix side.
     * For NDCProxy it is used also for logging (requests/responses to NDC are stored in files, filename contains traceID to identify where it was sent)
     */
    get fareLogixTraceID(): string {
        return this._flxConfig.fareLogixTrace;
    }
    protected get ndcSoapClient(): FarelogicWebserviceClient {
        return this._ndcSoapClient;
    }
    private _ndcSoapClient: FarelogicWebserviceClient;

    private _flxConfig: FarelogixConfiguration;

    constructor(flxConfig: FarelogixConfiguration) {
        this._flxConfig = flxConfig;
        this._ndcSoapClient = new FarelogicWebserviceClient(flxConfig);
    }
}
