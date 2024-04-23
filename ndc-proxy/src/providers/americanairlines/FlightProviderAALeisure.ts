import {Service} from 'typedi';
import {NDCMetaDataHelper} from './metadata/NDCMetaDataHelper';
import {BaseFarelogixFlightProvider} from './BaseFarelogixFlightProvider';
import {env} from '../../env';
import {LoggerFactory} from '../../lib/logger';

@Service()
export class FlightProviderAALeisure extends BaseFarelogixFlightProvider {
    public static PROVIDERID = 'AALEISURE';
    constructor(
        metaDataHelper: NDCMetaDataHelper) {
        super(LoggerFactory.createLogger('flight provider'), metaDataHelper, FlightProviderAALeisure.PROVIDERID, env.AA_LEISURE);
    }

    public isRetreveFromAPISupported(): boolean {
        return true;
    }
}
