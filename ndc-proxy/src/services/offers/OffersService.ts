import {Inject, Service} from 'typedi';
import {
    FareItem,
    FareItemType,
    FlightSearchCriteria,
    Itineraries,
    Offer,
    OptionSelectionCriteria,
    Passenger,
    PassengerSearchCriteria,
    PricedItem,
    PricedOfferResponse,
    PricePlan,
    SearchResults,
    SeatmapRequest,
    SeatMapResponse,
    Segment,
} from '../../interfaces/glider';
import {SessionContext} from '../SessionContext';
import {OffersStorageService} from './OffersStorageService';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors/';
import {EOffer} from '../../database/models/EOffer';
import {ProvidersFactory} from '../providersfactory/ProvidersFactory';
import {BaseFarelogixFlightProvider} from '../../providers/americanairlines/BaseFarelogixFlightProvider';
import {BusinessRulesEngine} from '../bre/BusinessRulesEngine';
import {ExtendedSessionContext} from '../ExtendedSessionContext';
import {PriceFactory} from '../../providers/americanairlines/utils/PriceFactory';
import {LoggerFactory} from '../../lib/logger';
import {Throttle, ThrottlingTimeoutError} from './Throttle';
import {logExecutionTime} from '../../lib/utils/logExecutionTime';
// returned by search
type OperationResult<T> = {
    result: T,
    errorOccurred: boolean,
    errorCode?: ErrorCodes,
    errorMessage?: string,
    providerID?: string
};

// export function Throttle(timeout: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
//     return (
//         target: any,
//         propertyKey: string,
//         descriptor: PropertyDescriptor
//     ) => {
//         const originalMethod = descriptor.value;
//
//         descriptor.value = async (...args: any[]) => {
//             return Promise.race([
//                 // @ts-ignore
//                 originalMethod.apply(this, args),
//                 new Promise<any>((_, reject) =>
//                     setTimeout(() => reject(new Error('Method execution timed out!')), timeout)
//                 ),
//             ]);
//         };
//
//         return descriptor;
//     };
// }

@Service()
export class OffersService {

    @Inject()
    private offersStorageService: OffersStorageService;

    @Inject()
    private providersFactory: ProvidersFactory;

    @Inject()
    private businessRulesEngine: BusinessRulesEngine;
    private log = LoggerFactory.createLogger('offers service');

    public async searchOffers(sessionContext: SessionContext, itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[]): Promise<SearchResults> {
        // find applicable flight providers for a given request
        const providers = await this.providersFactory.getApplicableFlightProviders(sessionContext, itinerary, passengers);
        // search for flights with multiple providers that are available

        if (!Array.isArray(providers) || providers.length === 0) {
            this.log.warn(`No providers were found for request, session context: ${JSON.stringify(sessionContext)}`);
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, 'No flight providers configured, please contact sales@simard.io', ErrorCodes.NO_RESULTS_FOR_SEARCH_CRITERIA);
        }

        // init object to store merged search results (from multiple providers)
        const searchResults = this.initializeSearchResults();
        // helper to merge results from providers into above 'searchResults'
        const mergeSearchResults = (singleProviderSearchResults: SearchResults): void => {
            singleProviderSearchResults.offers.forEach((value, key) => searchResults.offers.set(key, value));
            singleProviderSearchResults.itineraries.segments.forEach((value, key) => searchResults.itineraries.segments.set(key, value));
            singleProviderSearchResults.itineraries.combinations.forEach((value, key) => searchResults.itineraries.combinations.set(key, value));
            singleProviderSearchResults.passengers.forEach((value, key) => searchResults.passengers.set(key, value));
            singleProviderSearchResults.pricePlans.forEach((value, key) => searchResults.pricePlans.set(key, value));
        };
        let resultsPromises: OperationResult<SearchResults>[];
        await logExecutionTime(`search with providers`, async () => {
            // search with every provider (in parallel)
            resultsPromises = await Promise.all(
                providers.map(provider => this.searchWithProviderThrottled(provider, itinerary, passengers, sessionContext))
            );
        });
        // only merge successful responses
        const successfulResults = resultsPromises.filter(rec => rec.errorOccurred === false).map(rec => rec.result);
        await logExecutionTime(`merge providers search results into single response`, async () => {
            // merge results
            for (const results of successfulResults) {
                mergeSearchResults(results);
            }
        });
        return searchResults;
    }

    public async priceOffers(context: SessionContext, offerIDs: string[], optionSelection: OptionSelectionCriteria[]): Promise<PricedOfferResponse> {
        // TODO - now we only use 1 offerID, should take multiple
        const offerID = offerIDs[0];
        // find offer in the database to identify which provider should be used
        const offerRecords = await this.retrieveOffersFromDatabase([offerID]);
        const offer: EOffer = offerRecords[0];
        const provider = this.providersFactory.getFlightProviderById(offer.providerID);
        this.log.info(`Price offer ${offerID}, provider: ${offer.providerID}`);
        // evaluate business rules to get config/context details
        const extendedContext: ExtendedSessionContext = await this.businessRulesEngine.createExtendedSessionContext(context, offer.providerID);
        const pricedOfferResponse = await provider.offersPrice(offerIDs, optionSelection, extendedContext);
        // since offerID after pricing might change, we need to also store this new offer(and offeriD) in the database
        const pricedOffer = Object.assign({}, offer);   // copy all details from previous offer - hack
        pricedOffer.price = pricedOfferResponse.offer.price.public;
        pricedOffer.currency = pricedOfferResponse.offer.price.currency;
        pricedOffer.offerID = pricedOfferResponse.offerId;
        pricedOffer.id = undefined;
        // await this.offersStorageService.storeSearchResultsOffer(offer.providerID, pricedOfferResponse.offerId, offer);

        this.decorateOfferWithBookingFees(pricedOfferResponse, extendedContext);
        await this.offersStorageService.saveOfferEntity(pricedOfferResponse.offerId, pricedOffer);
        return pricedOfferResponse;
    }

    public async retrieveSeatmap(context: SessionContext, offerIDs: string[], seatmapRequest?: SeatmapRequest): Promise<SeatMapResponse> {
        const offerRecords = await this.retrieveOffersFromDatabase(offerIDs);
        const offer: EOffer = offerRecords[0];
        const provider = this.providersFactory.getFlightProviderById(offer.providerID);
        return await provider.retrieveSeatmap(offerIDs, seatmapRequest);
    }

    /**
     * This adds any additional booking fees to an existing offer price response(if applicable)
     * @param pricedOfferResponse
     * @param extendedContext
     * @private
     */
    public decorateOfferWithBookingFees(pricedOfferResponse: PricedOfferResponse, extendedContext: ExtendedSessionContext): void {
        if (extendedContext.bookingFeeAmount > 0) {
            // TODO replace this with dedicated library for math on amounts
            const amountInMainUnits = PriceFactory.convertAmount(extendedContext.bookingFeeAmount, 2);
            const priceItem: PricedItem = new PricedItem();
            priceItem.fare = [new FareItem(FareItemType.surcharge, amountInMainUnits, 'Service Fee')];
            pricedOfferResponse.offer.pricedItems.push(priceItem);
            pricedOfferResponse.offer.price.public += amountInMainUnits;
            // FIXME: in the future it may happen that currency of pricing response may not be same as booking fee
            // what should we do then?
        }
    }
    private async searchWithProviderThrottled(flightProvider: BaseFarelogixFlightProvider, itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[], sessionContext: SessionContext): Promise<OperationResult<SearchResults>> {
        let results: OperationResult<SearchResults>;
        await logExecutionTime(`searchWithProvider:${flightProvider.providerID}`, async () => {
        try {
            results = await this.searchWithProvider(flightProvider, itinerary, passengers, sessionContext);
        } catch (err) {
            let errorCode: ErrorCodes = ErrorCodes.UNKNOWN_ERROR;
            let errorMessage = 'Unknown error';
            if (err instanceof BaseGliderException) {
                errorCode = (err as BaseGliderException).errorCode;
                errorMessage = (err as BaseGliderException).message;
            } else if (err instanceof ThrottlingTimeoutError) {
                this.log.error(`Offer search or results processing time exceeded max timeout and it was throttled for provider:${flightProvider.providerID}`);
                errorCode = ErrorCodes.THIRDPARTY_TIMEOUT;
                errorMessage = 'Search took too long time';
            } else if (err instanceof Error) {
                errorMessage = (err as Error).message;
            }
            results = {
                result: undefined,
                errorOccurred: true,
                errorCode,
                errorMessage,
                providerID: flightProvider.providerID,
            };
        }
        });
        return results;
    }
    @Throttle(60000)
    private async searchWithProvider(flightProvider: BaseFarelogixFlightProvider, itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[], sessionContext: SessionContext): Promise<OperationResult<SearchResults>> {
        // get business rules/settings that are specific to a provider
        const extendedSessionContext = await this.businessRulesEngine.createExtendedSessionContext(sessionContext, flightProvider.providerID);
        try {
            this.log.debug(`Searching with provider:${flightProvider.providerID}`);
            const singleProviderSearchResults: SearchResults = await flightProvider.flightSearch(itinerary, passengers, extendedSessionContext);
            await this.offersStorageService.storeSearchResults(flightProvider.providerID, singleProviderSearchResults);
            this.log.debug(`Completed searching with provider:${flightProvider.providerID}`);
            return {
                result: singleProviderSearchResults,
                errorOccurred: false,
            };
        } catch (err) {
            this.log.error(`Provider:${flightProvider.providerID}, error:${err}`);
            let errorCode: ErrorCodes = ErrorCodes.UNKNOWN_ERROR;
            let errorMessage = 'Unknown error';
            if (err instanceof BaseGliderException) {
                errorCode = (err as BaseGliderException).errorCode;
                errorMessage = (err as BaseGliderException).message;
            } else if (err instanceof Error) {
                errorMessage = (err as Error).message;
            }
            return {
                result: undefined,
                errorOccurred: true,
                errorCode,
                errorMessage,
                providerID: flightProvider.providerID,
            };
        }
    }

    private initializeSearchResults(): SearchResults {
        const results: SearchResults = new SearchResults();
        results.offers = new Map<string, Offer>();
        results.passengers = new Map<string, Passenger>();
        const itineraries: Itineraries = new Itineraries();
        itineraries.segments = new Map<string, Segment>();
        itineraries.combinations = new Map<string, string[]>();
        results.itineraries = itineraries;
        results.pricePlans = new Map<string, PricePlan>();
        return results;
    }

    private async retrieveOffersFromDatabase(offerIDs: string[]): Promise<EOffer[]> {
        // try to find all offers in the database
        const offerRecords = await Promise.all(offerIDs.map(async offerID => await this.offersStorageService.findOfferByOfferId(offerID)));
        const filteredOfferRecords = offerRecords.filter(value => value !== undefined);  // remove undefined records (that is where offer was not found or expired)
        if (filteredOfferRecords.length !== offerIDs.length) {
            // not all requested offerIDs were found (e.g. one of offerID is invalid or offer already expired)
            // we need to figure out which offerIDs were invalid to return this in an error message
            const foundOfferIDs = filteredOfferRecords.map(value => value.offerID);
            const missingOfferIDs = [];
            offerIDs.forEach(value => {
                if (!foundOfferIDs.includes(value)) {
                    missingOfferIDs.push(value);
                }
            });
            throw new BaseGliderException(HttpStatusCode.CLIENT_BAD_REQUEST, `Offer expired or not found:${missingOfferIDs.join(',')}`, ErrorCodes.OFFER_NOT_FOUND);
        }
        return filteredOfferRecords;
    }
}
