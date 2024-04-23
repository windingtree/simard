import {Container, Inject, Service} from 'typedi';
import {FlightSearchCriteria, PassengerSearchCriteria} from '../../interfaces/glider';
import {FlightProviderAALeisure} from '../../providers/americanairlines/FlightProviderAALeisure';
import {FlightProviderAABusiness} from '../../providers/americanairlines/FlightProviderAABusiness';
import {BusinessRulesEngine} from '../bre/BusinessRulesEngine';
import {BaseFarelogixFlightProvider} from '../../providers/americanairlines/BaseFarelogixFlightProvider';
import {env} from '../../env';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors/';
import {SessionContext} from '../SessionContext';
import {FlightProviderUALeisure} from '../../providers/americanairlines/FlightProviderUALeisure';
import {LoggerFactory} from '../../lib/logger';
import {FlightProviderUABusiness} from '../../providers/americanairlines/FlightProviderUABusiness';

@Service()
export class ProvidersFactory {

    @Inject()
    private businessRulesEngine: BusinessRulesEngine;

    private availableFlightProviders: BaseFarelogixFlightProvider[]; // lazy initiated array of available flight providers
    private log = LoggerFactory.createLogger('provider factory');

    /**
     * Return list of flight providers that should be requested for flights for a given search request
     * @param sessionContext
     * @param itinerary
     * @param passengers
     * @private
     */
    public async getApplicableFlightProviders(sessionContext: SessionContext, itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[]): Promise<BaseFarelogixFlightProvider[]> {
        // lazy initialization of available flight providers (only if not initialized)
        this.lazyInitializeAvailableFlightProviders();
        const providerIDs: string[] = await this.businessRulesEngine.findProviderForSearchCriteria(sessionContext, itinerary, passengers);
        return providerIDs.map(providerID => this.getFlightProviderById(providerID));
    }

    /**
     * Return instance of flight provider for a given provider ID
     * @param providerID
     * @private
     */
    public getFlightProviderById(providerID: string): BaseFarelogixFlightProvider {
        // lazy initialization of available flight providers (only if not initialized)
        this.lazyInitializeAvailableFlightProviders();
        if (!this.availableFlightProviders || this.availableFlightProviders.length === 0) {
            throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, 'Flight providers are not initialized or none is enabled', ErrorCodes.INVALID_SERVER_CONFIGURATION);
        }
        const provider = this.availableFlightProviders.find(value => value.providerID === providerID);
        if (!provider) {
            throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, `Cannot find flight provider:${providerID}`, ErrorCodes.INVALID_SERVER_CONFIGURATION);
        }
        return provider;
    }

    /**
     * Initialize all providers that are available (configured to be used/enabled)
     * @private
     */
    private lazyInitializeAvailableFlightProviders(): void {
        if (!this.availableFlightProviders) {
            this.availableFlightProviders = [];
            if (env.AA_LEISURE_isEnabled) {   // only add "AA Leisure" flight provider when its enabled
                const provider = Container.get<FlightProviderAALeisure>(FlightProviderAALeisure);
                this.availableFlightProviders.push(provider);
                this.log.info(`AA Leisure is enabled`);
            } else {
                this.log.warn(`AA Leisure is disabled`);
            }
            if (env.AA_BUSINESS_isEnabled) {   // only add "AA Business" flight provider when its enabled
                const provider = Container.get<FlightProviderAABusiness>(FlightProviderAABusiness);
                this.availableFlightProviders.push(provider);
                this.log.info(`AA Business is enabled`);
            } else {
                this.log.warn(`AA Business is disabled`);
            }
            if (env.UA_LEISURE_isEnabled) {   // United Airlines
                const provider = Container.get<FlightProviderUALeisure>(FlightProviderUALeisure);
                this.availableFlightProviders.push(provider);
                this.log.info(`UA Leisure is enabled`);
            } else {
                this.log.warn(`UA Leisure is disabled`);
            }
            if (env.UA_BUSINESS_isEnabled) {   // United Airlines
                const provider = Container.get<FlightProviderUABusiness>(FlightProviderUABusiness);
                this.availableFlightProviders.push(provider);
                this.log.info(`UA Business is enabled`);
            } else {
                this.log.warn(`UA Business is disabled`);
            }
        }
    }
}
