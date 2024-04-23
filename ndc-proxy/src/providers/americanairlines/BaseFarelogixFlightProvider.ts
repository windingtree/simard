import {LoggerInterface, logMessage} from '../../lib/logger';
import {
    CreateOrderResponse,
    FlightSearchCriteria,
    OptionSelectionCriteria,
    Passenger,
    PassengerSearchCriteria,
    PaymentDetails,
    PricedOfferResponse,
    SearchResults,
    SeatmapRequest,
    SeatMapResponse
} from '../../interfaces/glider';
import {SearchResultsBuilder} from './SearchResultsBuilder';
import {
    NDCAirShoppingResponse, NDCAirShoppingRS,
    NDCItineraryCriteria,
    NDCOffer,
    NDCOfferPriceResponse,
    NDCOfferPriceRS,
    NDCOrderCreateResponse,
    NDCPassenger,
    NDCSeatAvailabilityResponse
} from '../../interfaces/ndc';
import {OfferPriceResultsBuilder} from './OfferPriceResultsBuilder';
import {NDCMetaDataHelper} from './metadata/NDCMetaDataHelper';
import {ShoppingMetadataContainer} from './metadata/ShoppingMetadataContainer';
import {NDCPassengerConverter} from './converters/mappers/NDCPassengerConverter';
import {PricingMetadataContainer} from './metadata/PricingMetadataContainer';
import {OrderCreateResultsBuilder} from './OrderCreateResultsBuilder';
import {SeatMapResponseBuilder} from './SeatMapResponseBuilder';
import {SeatMapMetadataContainer} from './metadata/SeatMapMetadataContainer';
import {buildSeatOfferItems, calculateTotalSeatsPrice} from './converters/ordercreate';
import {FarelogixConfiguration} from '../../env';
import {convertFromGliderItineraries} from './converters/mappers';
import {FareLogixAirShoppingClient} from './converters/FareLogixAirShoppingClient';
import {FareLogixPricingClient} from './converters/FareLogixPricingClient';
import {FareLogixSeatMapClient} from './converters/FareLogixSeatMapClient';
import {FareLogixOrderClient} from './converters/FareLogixOrderClient';
import {toNdcPaymentDetails} from './converters/mappers/paymentDetailsMapper';
import {OrderRetrievalResponse} from '../../interfaces/glider/order/OrderRetrievalResponse';
import {NDCOrderRetrievalResponse} from '../../interfaces/ndc/order/NDCOrderRetrievalResponse';
import {OrderRetrievalResultsBuilder} from './OrderRetrievalResultsBuilder';
import {OrderSyncStatus} from '../../interfaces/glider/order/OrderSyncStatua';
import { BaseGliderException, ErrorCodes, HttpStatusCode } from '../../api/errors';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';

export abstract class BaseFarelogixFlightProvider {
    get providerID(): string {
        return this._providerID;
    }
    get flxSeatMapClient(): FareLogixSeatMapClient {
        return this._flxSeatMapClient;
    }
    get flxAirPricingClient(): FareLogixPricingClient {
        return this._flxAirPricingClient;
    }
    get flxConfig(): FarelogixConfiguration {
        return this._flxConfig;
    }
    protected get flxAirShoppingClient(): FareLogixAirShoppingClient {
        return this._flxAirShoppingClient;
    }

    private paxMapper: NDCPassengerConverter = new NDCPassengerConverter();
    private _flxAirShoppingClient: FareLogixAirShoppingClient;
    private _flxAirPricingClient: FareLogixPricingClient;
    private _flxSeatMapClient: FareLogixSeatMapClient;
    private _flxOrderClient: FareLogixOrderClient;
    private _flxConfig: FarelogixConfiguration;
    private paxConverter = new NDCPassengerConverter();

    constructor(
        protected log: LoggerInterface,
        protected metaDataHelper: NDCMetaDataHelper,
        protected _providerID: string,
        flxConfig: FarelogixConfiguration
        ) {
        this._flxConfig = flxConfig;
        this._flxAirShoppingClient = new FareLogixAirShoppingClient(flxConfig);
        this._flxAirPricingClient = new FareLogixPricingClient(flxConfig);
        this._flxSeatMapClient = new FareLogixSeatMapClient(flxConfig);
        this._flxOrderClient = new FareLogixOrderClient(flxConfig);
    }

    /**
     * Check expired Offers
     * @param shoppingOfferIDs
     */
    public async checkExpiredOffers(shoppingOfferIDs: string[]): Promise<boolean> {
        return false;
    }

    /**
     * Search for flights (/offers/search)
     * @param itinerary
     * @param passengers
     */
    public async flightSearch(itinerary: FlightSearchCriteria, passengers: PassengerSearchCriteria[], sessionContext: ExtendedSessionContext): Promise<SearchResults> {
        // convert Glider search criteria to NDC format
        const ndcItins: NDCItineraryCriteria[] = convertFromGliderItineraries(itinerary);
        const ndcPassengers: NDCPassenger[] = this.paxConverter.convertFromPassengerSearchCriteriaArray(passengers);
        // make a call and wait for results
        const response: NDCAirShoppingResponse = await this.flxAirShoppingClient.searchForFlights(ndcPassengers, ndcItins, sessionContext);
        // convert NDC format to Glider format search results
        const searchResultsBuilder = this.createSearchResultsBuilder(response.AirShoppingRS);
        const offers: SearchResults = searchResultsBuilder.build(sessionContext);
        await logMessage('search results ID mapping', JSON.stringify(searchResultsBuilder.getMapper().serialize()), 'json');
        // store NDC response (with ID mappings between NDC and Glider) in database, will be needed for seatmap, pricing, order creation
        await this.metaDataHelper.saveShoppingMetadata(this._providerID, Array.from(offers.offers.keys()), response, searchResultsBuilder.getMapper());
        return offers;
    }

    /**
     * Price selected offer(s)
     * @param shoppingOfferIDs Offer IDs
     * @param optionSelection Selected options (e.g. seats)
     */
    public async offersPrice(shoppingOfferIDs: string[], optionSelection: OptionSelectionCriteria[], sessionContext: ExtendedSessionContext): Promise<PricedOfferResponse> {
        let pricingResponse: PricedOfferResponse;
        if (shoppingOfferIDs.length > 0) {
            // it may happen that there are more than one shoppingOfferIDs (e.g. separate offer for outbound and for return trips)
            // but they came from the same shopping call to NDC provider
            // hence, if we need to find saved shopping results from DB, we need only one of them (either outbound or return, does not matter)
            const shoppingOfferID = shoppingOfferIDs[0];    // so let's take 1st offerID
            // retrieve NDC shopping resutls from DB that are associated with requested shoppingOfferID
            const shoppingMetadataContainer: ShoppingMetadataContainer = await this.metaDataHelper.findShoppingMetadata(this._providerID, shoppingOfferID);
            // @ts-ignore
            let seatmapMetadataContainer: SeatMapMetadataContainer;
            try {
                if (optionSelection) {
                    seatmapMetadataContainer = await this.metaDataHelper.findSeatMapMetadata(this._providerID, shoppingOfferID);
                }
            } catch (err: any) {
                // TODO - I think we should throw exception here (if pax requested seats but didn't request seatmap before it should fail fast)
                console.log('No seatmap');
            }

            // TODO handle case where multiple offers are requested - we need in this case price them separately and return result, for now we will price only first

            // find requested offer among NDC shopping results
            let ndcOffer: NDCOffer;
            try {
                ndcOffer = this.metaDataHelper.findNDCOffer(shoppingOfferID, shoppingMetadataContainer);
            } catch (error) {
                if ((error as Error).message.includes('Could not find offer')) {
                    throw new BaseGliderException(HttpStatusCode.CLIENT_NOT_FOUND, `Could not find offer ${shoppingOfferID} or offer has expired`, ErrorCodes.OFFER_NOT_FOUND);
                }

                // unknown error rethrow
                throw error;
            }
            const {shoppingResponse: {AirShoppingRS}} = shoppingMetadataContainer;
            // make a call to NDC OfferPrice, to get a price for an offer
            const offerPriceRS: NDCOfferPriceResponse = await this.flxAirPricingClient.offerPricing(AirShoppingRS.ShoppingResponseID.ResponseID, ndcOffer, AirShoppingRS.PassengerList);

            // convert NDC format to Glider format
            const offerBuilder = new OfferPriceResultsBuilder(offerPriceRS.OfferPriceRS, shoppingMetadataContainer.mapping);
            pricingResponse = offerBuilder.build(sessionContext)[0];

            // store pricing result in database (will be needed to create an order)
            const pricedOfferId = pricingResponse.offerId;
            const pricingMetadataContainer = await this.metaDataHelper.savePricingMetadata(this._providerID, pricedOfferId, offerPriceRS, offerBuilder.getMapper(), shoppingOfferIDs, optionSelection);
            await logMessage('pricing results ID mapping', JSON.stringify(shoppingMetadataContainer.mapping), 'json');
            if (seatmapMetadataContainer && optionSelection && optionSelection.length) {
                // there were seats requested and we also have seatmap response available
                // since Farelogix does not return total price of offer together with seats(in pricing response) but only returns offer price...
                // we need to take care of it here and sum up offer price with selected seats prices
                const totalSeatPrice = calculateTotalSeatsPrice(seatmapMetadataContainer, pricingMetadataContainer);
                // convert price to local (and to correct decimal point)
                const totalSeatPriceConverted = offerBuilder.convertPrice(totalSeatPrice, pricingResponse.offer.price.currency);
                // this.log.debug(`Price without seats:${pricingResponse.offer.price.public}, Total Seat price(before conversion):${totalSeatPrice}, Total Seat price(after conversion):${totalSeatPriceConverted}`);
                pricingResponse.offer.price.public += totalSeatPriceConverted;
                // this.log.debug(`Price with seats:${pricingResponse.offer.price.public}`);
            }

        }
        return pricingResponse;
    }

    /**
     * Retrieve seatmap for selected offers
     * @param shoppingOfferIDs
     */
    public async retrieveSeatmap(shoppingOfferIDs: string[], seatmapRequest: SeatmapRequest): Promise<SeatMapResponse> {
        let seatmapResponse: SeatMapResponse;
        if (shoppingOfferIDs.length > 0) {
            // TODO handle case where multiple offers are requested
            const shoppingOfferID = shoppingOfferIDs[0];    // take 1st offerID

            // get customData of metaData that include shoppingOfferID
            const shoppingMetadataContainer: ShoppingMetadataContainer = await this.metaDataHelper.findShoppingMetadata(this._providerID, shoppingOfferID);
            // get value(real offerID) that key === shoppingOfferID from mapping of shoppingMetadataContainer, and then get airlineOffer that airlineOffer.OfferID === real offerID from airlineOffers
            const ndcOfferShopping = this.metaDataHelper.findNDCOffer(shoppingOfferID, shoppingMetadataContainer);
            const {shoppingResponse: {AirShoppingRS}} = shoppingMetadataContainer;
            const offerPriceRS: NDCOfferPriceRS = (await this.flxAirPricingClient.offerPricing(AirShoppingRS.ShoppingResponseID.ResponseID, ndcOfferShopping, AirShoppingRS.PassengerList)).OfferPriceRS;
            const pricedOffer = offerPriceRS.PricedOffer[0];
            const gliderPassengers: Map<string, Passenger> = seatmapRequest ? seatmapRequest.passengers : new Map<string, Passenger>();
            const ndcPassengers: NDCPassenger[] = this.paxMapper.updateNDCPassengersWithGlider(gliderPassengers, AirShoppingRS.PassengerList);

            const seatAvailRS: NDCSeatAvailabilityResponse = await this.flxSeatMapClient.seatAvailability(offerPriceRS.ShoppingResponseID.ResponseID, pricedOffer, ndcPassengers, offerPriceRS);
            const seatMapResponseBuilder: SeatMapResponseBuilder = new SeatMapResponseBuilder(this._flxConfig, seatAvailRS.SeatAvailabilityRS, offerPriceRS, shoppingMetadataContainer.mapping);
            seatmapResponse = seatMapResponseBuilder.build();

            await this.metaDataHelper.saveSeatmapMetadata(this._providerID, shoppingOfferID, seatAvailRS, seatMapResponseBuilder.getMapper());
            await logMessage('seatmap results ID mapping', JSON.stringify(seatMapResponseBuilder.getMapper().serialize()), 'json');

        }
        return seatmapResponse;
    }

    public async createOrder(pricedOfferID: string, passengers: Map<string, Passenger>, paymentDetails: PaymentDetails, extendedContext: ExtendedSessionContext): Promise<CreateOrderResponse> {
        // convert passengers (from glider to NDC)

        const ndcPassengers: NDCPassenger[] = this.paxMapper.convertPassengersMapFromGlider(passengers);

        // TODO - remove hardcoded currency code
        const ndcPaymentDetails = toNdcPaymentDetails(paymentDetails, 0, 'USD');
        const usePciProxy = paymentDetails.cardDetailsMasked;   // use PCI-Proxy if card details are masked
        // TODO handle case where multiple offers are requested

        // find previous response from airPricing - it's needed to create order request
        const pricingMetadataContainer: PricingMetadataContainer = await this.metaDataHelper.findPricingMetadata(this._providerID, pricedOfferID);
        const pricedOffers: NDCOffer[] = pricingMetadataContainer.pricingResponse.OfferPriceRS.PricedOffer;
        // TODO handle case where array is empty or has more than 1 elem
        let ndcSeatSelectionOffer: NDCOffer;
        try {
            const shoppingOfferID = pricingMetadataContainer.shoppingOfferIDs[0];
            const seatMetaDataContainer: SeatMapMetadataContainer = await this.metaDataHelper.findSeatMapMetadata(this._providerID, shoppingOfferID);
            ndcSeatSelectionOffer = buildSeatOfferItems(seatMetaDataContainer, pricingMetadataContainer);

        } catch (err: any) {
            this.log.debug(`No previous seatmap response for offerID:${pricedOfferID}`);
        }

        const offerToCreate = pricedOffers[0];
        const response: NDCOrderCreateResponse = await this._flxOrderClient.orderCreate(pricingMetadataContainer.pricingResponse.OfferPriceRS.ShoppingResponseID.ResponseID, offerToCreate, ndcPassengers, ndcPaymentDetails, ndcSeatSelectionOffer, usePciProxy);
        const builder = new OrderCreateResultsBuilder(this.flxConfig, response.OrderViewRS);
        const order = builder.build(extendedContext);
        // attach provider ID to providerDetails
        // order.order.providerDetails.providerID = this.providerID;
        return order;
    }

    public async retrieveOrder(providerOrderID: string, orderId: string | undefined = undefined, extendedContext: ExtendedSessionContext): Promise<OrderRetrievalResponse> {
        // return from API
        // get the order from fareLogix
        const orderResponse: NDCOrderRetrievalResponse = await this._flxOrderClient.retrieveOrderById(providerOrderID);
        const builder = new OrderRetrievalResultsBuilder(this.flxConfig, orderResponse.OrderViewRS, undefined, orderId);

        const order = builder.build(extendedContext);
        order.syncStatus = OrderSyncStatus.REALTIME;

        this.log.info('retrieveOrder done');
        return order;
    }

    public abstract isRetreveFromAPISupported(): boolean;

    /**
     * Instantiates SearchResultsBuilder that will process search results and return offers in WT API format.
     * If custom logic needs to be developed for a given provider, this method can be overriden to return custom implementation of SearchResultsBuilder
     * @param searchResults
     * @protected
     */
    protected createSearchResultsBuilder(searchResults: NDCAirShoppingRS): SearchResultsBuilder {
        return new SearchResultsBuilder(this.flxConfig, searchResults);
    }

}
