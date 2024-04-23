import {Service} from 'typedi';
import {NDCMetaDataHelper} from './metadata/NDCMetaDataHelper';
import {BaseFarelogixFlightProvider} from './BaseFarelogixFlightProvider';
import {LoggerFactory} from '../../lib/logger';
import {env} from '../../env';

@Service()
export class FlightProviderAABusiness extends BaseFarelogixFlightProvider {
    public static PROVIDERID = 'AABUSINESS';
    constructor(
        metaDataHelper: NDCMetaDataHelper) {
        super(LoggerFactory.createLogger('flight provider'), metaDataHelper, FlightProviderAABusiness.PROVIDERID, env.AA_BUSINESS);
    }

    public isRetreveFromAPISupported(): boolean {
        return false;
    }
}
