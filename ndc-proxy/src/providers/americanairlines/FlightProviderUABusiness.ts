import {Service} from 'typedi';
import {NDCMetaDataHelper} from './metadata/NDCMetaDataHelper';
import {BaseFarelogixFlightProvider} from './BaseFarelogixFlightProvider';
import {env} from '../../env';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class FlightProviderUABusiness extends BaseFarelogixFlightProvider {
    public static PROVIDERID = 'UABUSINESS';
    constructor(
        metaDataHelper: NDCMetaDataHelper) {
        super(LoggerFactory.createLogger('flight provider'), metaDataHelper, FlightProviderUABusiness.PROVIDERID, env.UA_LEISURE);
    }

    public isRetreveFromAPISupported(): boolean {
        return true;
    }

}
