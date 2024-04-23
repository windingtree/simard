import {Service} from 'typedi';
import {NDCMetaDataHelper} from './metadata/NDCMetaDataHelper';
import {BaseFarelogixFlightProvider} from './BaseFarelogixFlightProvider';
import {env} from '../../env';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class FlightProviderUALeisure extends BaseFarelogixFlightProvider {
    public static PROVIDERID = 'UALEISURE';
    constructor(
        metaDataHelper: NDCMetaDataHelper) {
        super(LoggerFactory.createLogger('flight provider'), metaDataHelper, FlightProviderUALeisure.PROVIDERID, env.UA_LEISURE);
    }

    public isRetreveFromAPISupported(): boolean {
        return true;
    }

}
