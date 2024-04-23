import {
    NDCAirShoppingRS,
    NDCBaggageAllowanceListItem,
    NDCBaggageCategory,
    NDCFlight,
    NDCFlightSegment,
    NDCOffer,
    NDCOfferItem,
    NDCPassenger,
    NDCPriceClassListItem,
    NDCServiceDefinition
} from '../../interfaces/ndc';
import {
    BaggageAllowance,
    ExtendedPriceDetails,
    Itineraries,
    Offer,
    Passenger,
    Penalties,
    PricePlan,
    PricePlanReference,
    SearchResults,
    Segment
} from '../../interfaces/glider';
import {convertToGliderPassenger, convertToGliderSegment} from '../../lib/ndc/ndcFormatUtils';
import {BaseResponseBuilder} from './BaseResponseBuilder';
import {generateUUID, HashCodeBuilder} from '../../lib/uuid';
import {BaseGliderException, ErrorCodes, HttpStatusCode} from '../../api/errors';
import {FarelogixConfiguration} from '../../env';
import {getStaticCabinTypeDescriptions, getStaticServiceDescriptions} from './staticDescriptionUtils';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';
import {PriceFactory} from './utils/PriceFactory';

interface OfferItemPlanAttributes {
    pricePlanName: string;
    pricePlanDescription: string[];
    cancelFeeInd: boolean|undefined;
    changeFeeInd: boolean|undefined;
    refundableInd: boolean|undefined;
}

export class SearchResultsBuilder extends BaseResponseBuilder<SearchResults> {
    private searchResults: NDCAirShoppingRS;
    // @ts-ignore
    private dataListSegmentsIndex: Map<string, NDCFlightSegment> = new Map<string, NDCFlightSegment>();
    // @ts-ignore
    private dataListFlightsIndex: Map<string, NDCFlight> = new Map<string, NDCFlight>();
    private dataListPriceClassIndex: Map<string, NDCPriceClassListItem> = new Map<string, NDCPriceClassListItem>();
    private dataListServiceDefinitionIndex: Map<string, NDCServiceDefinition> = new Map<string, NDCServiceDefinition>();
    // @ts-ignore
    private dataListBaggageAllowancesIndex: Map<string, NDCBaggageAllowanceListItem> = new Map<string, NDCBaggageAllowanceListItem>();
    // @ts-ignore
    private dataListPassengersIndex: Map<string, NDCPassenger> = new Map<string, NDCPassenger>();

    private pricePlanManager = new PricePlansSet();
    private offerToPricePlanReferencesMap: Map<string, Map<string, string[]>> = new Map<string, Map<string, string[]>>();
    private flxConfig: FarelogixConfiguration;

    constructor(flxConfig: FarelogixConfiguration, searchResults: NDCAirShoppingRS) {
        super();
        this.searchResults = searchResults;
        this.flxConfig = flxConfig;
    }

    /**
     * Build Glider offers (offers, price plans, itineraries, passengers)
     */
    public build(sessionContext: ExtendedSessionContext): SearchResults {
        const results = new SearchResults();
        this.initialize();
        results.passengers = this.buildPassengers(this.searchResults.PassengerList);
        results.itineraries = this.buildItineraries(this.searchResults.FlightList, this.searchResults.FlightSegmentList);
        results.offers = this.buildOffers(this.searchResults.AirlineOffers, sessionContext);
        results.pricePlans = this.buildPricePlans(this.searchResults.PriceClassList);
        return this.mapNDCidentifiersToUUID(results);
    }
    protected mapNDCidentifiersToUUID(results: SearchResults): SearchResults {
        const offers = [...results.offers.entries()];
        for (const [offerId, offer] of offers) {
            const entries = [...offer.pricePlansReferences.entries()];
            for (const [pricePlanRefID, pricePlanReference] of entries) {
                offer.pricePlansReferences.delete(pricePlanRefID);
                offer.pricePlansReferences.set(pricePlanRefID, pricePlanReference);
                const newflights = [];
                for (const flightRefId of pricePlanReference.flights) {
                    newflights.push(super.map(flightRefId));
                }
                pricePlanReference.flights = newflights;
            }
            results.offers.delete(offerId);
            results.offers.set(super.map(offerId), offer);
        }
        const itinerarySegmentsEntries = [...results.itineraries.segments.entries()];
        for (const [segmentID, segment] of itinerarySegmentsEntries) {
            results.itineraries.segments.delete(segmentID);
            results.itineraries.segments.set(super.map(segmentID), segment);
        }
        const itineraryCombinationsEntries = [...results.itineraries.combinations.entries()];
        for (const [itineraryID, segments] of itineraryCombinationsEntries) {
            const newSegmentIDs = [];
            for (const segmentId of segments) {
                newSegmentIDs.push(super.map(segmentId));
            }
            results.itineraries.combinations.delete(itineraryID);
            results.itineraries.combinations.set(super.map(itineraryID), newSegmentIDs);
        }
        return results;
    }

    protected buildPassengers(passengerList: NDCPassenger[]): Map<string, Passenger> {
        const results = new Map<string, Passenger>();
        // iterate over passengers list and convert NDC Pax format to Glider Pax format
        passengerList.forEach(ndcPax => {
            const ndcPaxId = ndcPax.PassengerID;    // we can retain IDs
            const gliderPax = convertToGliderPassenger(ndcPax);
            results.set(ndcPaxId, gliderPax);
        });
        return results;
    }
    /**
     * Convert list of passengers from NDC response to Glider format
     */
    protected buildItineraries(flightList: NDCFlight[], flightSegmentList: NDCFlightSegment[]): Itineraries {
        const combinations: Map<string, string[]> = new Map<string, string[]>();
        // we now need to generate list of flights and segments
        flightList.forEach(ndcFlight => {
            // const flightKey = super.map(ndcFlight.FlightKey);
            const flightKey = ndcFlight.FlightKey;
            const segmentKeys = ndcFlight.SegmentReferences;
            // const segmentKeysUUIDs = segmentKeys.split(' ').map(segmentKey => super.map(segmentKey));
            const segmentKeysUUIDs = segmentKeys.split(' ');
            combinations.set(flightKey, segmentKeysUUIDs);
        });
        const segments: Map<string, Segment> = new Map<string, Segment>();
        flightSegmentList.forEach(segment => {
            // const segmentKey = super.map(segment.SegmentKey);
            const segmentKey = segment.SegmentKey;
            const gliderSegment = convertToGliderSegment(segment);
            segments.set(segmentKey, gliderSegment);
        });

        const result = new Itineraries();
        result.combinations = combinations;
        result.segments = segments;
        return result;
    }

    protected convertOffer(ndcOffer: NDCOffer, sessionContext: ExtendedSessionContext): Offer {
        const offerId = ndcOffer.OfferID;

        if (!this.offerToPricePlanReferencesMap.has(offerId)) {
            // this should not happen as all offers should be indexed
            throw new BaseGliderException(HttpStatusCode.SERVER_INTERNAL_SERVER_ERROR, `Cannot find offer ${offerId}`, ErrorCodes.UNKNOWN_ERROR);
        }
        const {TotalPrice: {Code: currencyCode, Total: totalPrice}} = ndcOffer;
        let price = super.convertPrice(totalPrice, currencyCode);
        price = this.addBookingFeeIfRequired(price, sessionContext);
        const tax = super.convertPrice(this.calculateTotalTaxes(ndcOffer), currencyCode);
        const commission = super.convertPrice(this.calculateCommission(ndcOffer), currencyCode);
        const offerExpiration = ndcOffer.TimeLimits.OfferExpiration;
        const offerPrice = new ExtendedPriceDetails(price, currencyCode, commission, tax);
        const pricePlansReferences: Map<string, PricePlanReference> = new Map<string, PricePlanReference>();
        const uniqueOfferPriceClassRefs: Map<string, string[]> = this.offerToPricePlanReferencesMap.get(ndcOffer.OfferID);
        uniqueOfferPriceClassRefs.forEach((flightKeys, pricePlanId) => {
            const gliderPricePlanRef = new PricePlanReference({flights: flightKeys});
            pricePlansReferences.set(pricePlanId, gliderPricePlanRef);
        });
        return new Offer({expiration: offerExpiration, price: offerPrice, pricePlansReferences, provider: ndcOffer.ValidatingCarrier});
    }

    protected addBookingFeeIfRequired(price: number, sessionContext: ExtendedSessionContext): number {
        if (sessionContext.bookingFeeAmount > 0) {
            price += PriceFactory.convertAmount(sessionContext.bookingFeeAmount, 2);
        }
        return price;
    }

    protected calculateTotalTaxes(ndcOffer: NDCOffer): number {
        let totalTax = 0;
        ndcOffer.OfferItems.forEach(value => {
            totalTax += Number(value.FareDetail.Price.Taxes.Total.Total);
        });
        return totalTax;
    }
    // TODO make commission configurable
    protected calculateCommission(ndcOffer: NDCOffer): number {
        return 0;
    }
    /**
     * Initialize any additional data/structures that are needed (e.g. load currency metadata so that prices can be correctly created/converted)
     * @protected
     */
    protected initialize(): void {
        if (Array.isArray(this.searchResults.Metadata.CurrencyMetadata)) {
            // initialize currency metadata (decimal points) and conversion rates
            super.initializePriceConverter(this.searchResults.Metadata.CurrencyMetadata);
        }
        // create indexes
        const AirShoppingRS = this.searchResults;
        // create segments index
        AirShoppingRS.FlightSegmentList.forEach(segment => {
            this.dataListSegmentsIndex.set(segment.SegmentKey, segment);
        });
        // create flights index
        AirShoppingRS.FlightList.forEach(flight => {
            this.dataListFlightsIndex.set(flight.FlightKey, flight);
        });
        // create baggage allowances index
        AirShoppingRS.BaggageAllowanceList.forEach(allowance => {
            this.dataListBaggageAllowancesIndex.set(allowance.BaggageAllowanceID, allowance);
        });
        // create passengers index
        AirShoppingRS.PassengerList.forEach(passenger => {
            this.dataListPassengersIndex.set(passenger.PassengerID, passenger);
        });
        // create price class index
        AirShoppingRS.PriceClassList.forEach(priceClass => {
            this.dataListPriceClassIndex.set(priceClass.PriceClassID, priceClass);
        });

        // create service definition index
        AirShoppingRS.ServiceDefinitions.forEach(serviceDefinition => {
            this.dataListServiceDefinitionIndex.set(serviceDefinition.ServiceDefinitionID, serviceDefinition);
        });

        // build price plans
        this.searchResults.AirlineOffers.forEach(ndcOffer => {
            // const offerId = super.map(ndcOffer.OfferID);
            const offerId = ndcOffer.OfferID;

            const ancillaryOfferItems = ndcOffer.OfferItems.filter(offerItem => offerItem.MandatoryInd === false);
            // first we iterate over non-mandatory offer items - those are ancillary products (e.g. priority boarding)
            // we want to collect all ancillary product names so that we can include that in product description (returned to the client) later
            const ancillaryDescriptions = new Set<string>();
            ancillaryOfferItems.forEach(offerItem => {
                const ancillariesIncluded: string[] = this.getAncillaryDescriptions(offerItem);
                ancillariesIncluded.forEach(ancillary => ancillaryDescriptions.add(ancillary));
            });

            // AirlineOffers/Offer/FlightsOverview contains a list of flights that are included in this offer
            // so we want to iterate over every flight and find what is a product for each flight\
            // product = what is included (flexibility conditions, if it can be cancelled or not, number of bags, meals, refundability, etc)
            // we will only look at mandatory offer items here (non mandatory are ancillaries)

            ndcOffer.FlightsOverview.forEach(flightOverview => {
                const flightRef = flightOverview.FlightRef;                 // flight ID

                // find all offer items that are associated with current flightRef
                // it can be more than one offerItem if there are multiple passengers/types
                // for example offerItem#1 is for all adults, offerItem#2 is for Children, all of them are for flightRef#1
                // Note: we are only going to ch mandatory offer items (those with MandatoryInd="true")
                const mandatoryFlightOfferItems = ndcOffer.OfferItems.filter(offerItem => offerItem.MandatoryInd === true && offerItem.Service.FlightRefs.split(' ').includes(flightRef));
                // first we want to make sure that all passengers have the same product (i.e. flexibility conditions, cancellation fee, product description, cabin)
                // hence iterate over all flight offer items for this flight and check they are all the same
                const flightPricePlansSet = new PricePlansSet();
                mandatoryFlightOfferItems.forEach(offerItem => {
                    // get product attributes (name, description, flexibility attributes)
                    const {pricePlanName, pricePlanDescription, changeFeeInd, refundableInd, cancelFeeInd} = this.getFlightPriceClassDetails(offerItem);
                    // create new plan only if same plan (with same name, description, attributes) didn't yet exist
                    flightPricePlansSet.addPricePlanIfNotExist(pricePlanName, cancelFeeInd, changeFeeInd, refundableInd, [...pricePlanDescription, ...ancillaryDescriptions.values()]);
                });

                // find MINIMUM baggage allowance for all passengers for this flight (reason: theoretically ADT may have e.g. 2 checked bags and INFant only 1 - in this case we want to show 1)
                const checkedBags = this.findMinimumCheckedBagsForFlight(ndcOffer, flightRef);  // number of checked bag
                const carryOnBags = this.findMinimumCarryOnBagsForFlight(ndcOffer, flightRef);  // number of carry-on bags
                if (flightPricePlansSet.values().length  !== 1) {
                    console.warn(`There are more than 1 distinct product defined for offer:${offerId} and flight:${flightRef}`);
                }
                const planDefinitionWithoutBags = flightPricePlansSet.values()[0];
                const planDefinitionWithBags = this.pricePlanManager.addPricePlanIfNotExist(planDefinitionWithoutBags.planName,
                    planDefinitionWithoutBags.cancelFeeInd,
                    planDefinitionWithoutBags.changeFeeInd,
                    planDefinitionWithoutBags.refundableInd,
                    planDefinitionWithoutBags.description, checkedBags, carryOnBags);

                if (!this.offerToPricePlanReferencesMap.has(offerId)) {
                    this.offerToPricePlanReferencesMap.set(offerId, new Map<string, string[]>());
                }
                const offerPricePlanToFlightsMap: Map<string, string[]> = this.offerToPricePlanReferencesMap.get(offerId);
                const pricePlanID = planDefinitionWithBags.pricePlanID;
                if (!offerPricePlanToFlightsMap.has(pricePlanID)) {
                    offerPricePlanToFlightsMap.set(pricePlanID, []);
                }
                const flightRefs = offerPricePlanToFlightsMap.get(pricePlanID);
                flightRefs.push(flightRef);
            });

        });
    }

    /**
     * This function should get product details associated with a given OfferItem.
     * It should return the following items:
     * - pricePlanName : name of the product (e.g. Economy, Main Cabin, Main Cabin Plus)
     * - pricePlanDescription: list of strings explaining what is included in a given product (e.g. extra leg room)
     * - flexibility attributes (cancelFeeInd, changeFeeInd, refundableInd)
     *
     * This function is supposed to return FLIGHT product name (associated with a flight, mandatory - not ancillary)
     * @param offerItem
     * @protected
     */
    protected getFlightPriceClassDetails(offerItem: NDCOfferItem): OfferItemPlanAttributes {

        const convertStringtoBoolOrUndefined = (boolStr: string|boolean): boolean|undefined => {
            if (typeof boolStr === 'boolean') {
                return boolStr;
            }
            if ((boolStr || '').toLowerCase() === 'true') { return true; }
            if ((boolStr || '').toLowerCase() === 'false') { return false; }
            return undefined;
        };

        // get flexibility/changeablilty/refundability attributes
        const cancelFeeInd: boolean = convertStringtoBoolOrUndefined(offerItem?.FareDetail?.FareRules?.Penalty?.CancelFeeInd);
        const changeFeeInd: boolean = convertStringtoBoolOrUndefined(offerItem?.FareDetail?.FareRules?.Penalty?.ChangeFeeInd);
        const refundableInd: boolean = convertStringtoBoolOrUndefined(offerItem?.FareDetail?.FareRules?.Penalty?.RefundableInd);
        // get product description (multiple lines of text explaining what is included in this product)
        const description: string[] = [];
        // a) from PriceClassRef; for most of AA flights, PriceClassRef will be defined and good marketing info will be in /DataLists/PriceClassList
        const priceClassRef = offerItem?.FareDetail?.FareRules?.PriceClassRef;
        let planName;
        if (priceClassRef && priceClassRef.length > 0 && this.dataListPriceClassIndex.has(priceClassRef)) {
            const priceClass = this.dataListPriceClassIndex.get(priceClassRef);
            if (Array.isArray(priceClass.Description) && priceClass.Description.length > 0) {
                description.push(...priceClass.Description);
            }
            planName = priceClass.Name;
        }
        // b) from Remarks; for e.g. codeshare flight it may be missing, so it can be taken from /Offers/OfferItem/FareDetail/Remarks/
        if (Array.isArray( offerItem?.FareDetail?.Remarks)) {
            description.push(... offerItem.FareDetail.Remarks);
            // TODO fix product name
            if (!planName) {
                planName =  offerItem.FareDetail.FareBasis.CabinTypeName;
            }
        }

        if (planName) {
            // get cabin/class amenities from static file (if defined)
            description.push(...getStaticCabinTypeDescriptions(this.flxConfig.airlineCode, planName));
        }

        return {
            pricePlanName: planName,
            pricePlanDescription: description,
            cancelFeeInd,
            changeFeeInd,
            refundableInd,
        };
    }

    /**
     * This function should get ancillary product details(services) associated with a given OfferItem.
     * For example, for UA, there may be additional services (OfferItem/Service/ServiceDefinitionRef) associated with an OfferItem
     * This function should return benefits that client gets for that service (e.g. priority boarding)
     * @param offerItem
     * @protected
     */
    protected getAncillaryDescriptions(offerItem: NDCOfferItem): string[] {
        const description: string[] = [];
        // check if there is a service associated with offer item
        if (offerItem?.Service?.ServiceDefinitionRef) {
            const serviceDefinitionRef = offerItem.Service.ServiceDefinitionRef;
            // find the service details (ServiceDefinitionList/ServiceDefinition)
            if (this.dataListServiceDefinitionIndex.has(serviceDefinitionRef)) {
                const serviceDefinition = this.dataListServiceDefinitionIndex.get(serviceDefinitionRef);
                description.push(...getStaticServiceDescriptions(this.flxConfig.airlineCode, serviceDefinition.Name));
            }
        }
        return description;
    }

    private findMinimumCheckedBagsForFlight(ndcOffer: NDCOffer, flightRef: string): number {
        const flightBaggageAllowances = ndcOffer.BaggageAllowance.filter(allowance => allowance.FlightRefs.split(' ').includes(flightRef));
        const INITIAL_BAGS = 999;
        let checkedBags = INITIAL_BAGS;
        flightBaggageAllowances.forEach(allowance => {
            if (allowance.BaggageAllowanceRef && allowance.BaggageAllowanceRef.length > 0 && this.dataListBaggageAllowancesIndex.has(allowance.BaggageAllowanceRef)) {
                const baggageAllowance = this.dataListBaggageAllowancesIndex.get(allowance.BaggageAllowanceRef);
                // check if 'checked' baggage is less than previous
                if (baggageAllowance.BaggageCategory === NDCBaggageCategory.Checked) {
                    checkedBags = Math.min(checkedBags, baggageAllowance.PieceAllowance.TotalQuantity);
                }
            }
        });
        // if there was no entry with baggage allowance, set it to 0 (safety, just in case)
        if (checkedBags === INITIAL_BAGS) {
            checkedBags = 0;
        }
        return checkedBags;
    }
    private findMinimumCarryOnBagsForFlight(ndcOffer: NDCOffer, flightRef: string): number {
        const flightBaggageAllowances = ndcOffer.BaggageAllowance.filter(allowance => allowance.FlightRefs.split(' ').includes(flightRef));
        const INITIAL_BAGS = 999;
        let carryOnBags = INITIAL_BAGS;
        flightBaggageAllowances.forEach(allowance => {
            if (allowance.BaggageAllowanceRef && allowance.BaggageAllowanceRef.length > 0 && this.dataListBaggageAllowancesIndex.has(allowance.BaggageAllowanceRef)) {
                const baggageAllowance = this.dataListBaggageAllowancesIndex.get(allowance.BaggageAllowanceRef);
                if (baggageAllowance.BaggageCategory === NDCBaggageCategory.CarryOn) {
                    carryOnBags = Math.min(carryOnBags, baggageAllowance.PieceAllowance.TotalQuantity);
                }
            }
        });
        if (carryOnBags === INITIAL_BAGS) {
            carryOnBags = 0;
        }
        return carryOnBags;
    }
    private buildOffers(ndcOffers: NDCOffer[], sessionContext: ExtendedSessionContext): Map<string, Offer> {
        const gliderOffers = new Map<string, Offer>();
        ndcOffers.forEach(ndcOffer => {
            // const offerId = super.map(ndcOffer.OfferID);
            const offerId = ndcOffer.OfferID;
            const offer = this.convertOffer(ndcOffer, sessionContext);
            gliderOffers.set(offerId, offer);
        });
        return gliderOffers;
    }

    private buildPricePlans(priceClassList: NDCPriceClassListItem[]): Map < string, PricePlan > {
        const pricePlans = new Map<string, PricePlan>();
        const uniquePricePlanDefinitions = this.pricePlanManager.values();
        uniquePricePlanDefinitions.forEach(pricePlanDefinition => {
            const pricePlanId = pricePlanDefinition.pricePlanID;
            const penalties = new Penalties();
            // only include flexibility attributes in the response when they are true or false (undefined should not be returned)
            if (pricePlanDefinition.changeFeeInd !== undefined) { penalties.isChangeableWithFee = pricePlanDefinition.changeFeeInd; }
            if (pricePlanDefinition.refundableInd !== undefined) { penalties.isRefundable = pricePlanDefinition.refundableInd; }
            if (pricePlanDefinition.cancelFeeInd !== undefined) { penalties.isCancelableWithFee = pricePlanDefinition.cancelFeeInd; }
            const gliderPricePlan = new PricePlan({
                name: pricePlanDefinition.planName,
                amenities: removeEmptyArrayElements(pricePlanDefinition.description),
                checkedBaggages: new BaggageAllowance(pricePlanDefinition.checkedBags),
                penalties,
            });
            pricePlans.set(pricePlanId, gliderPricePlan);
        });
        return pricePlans;
    }

}

function removeEmptyArrayElements(arr: string[]): string[] {
    if (Array.isArray(arr)) {
        return arr.filter(item => item && item.length > 0);
    }
    return arr;
}

export interface HashCodeComparable {
    hashCode(): number;
}

export class HashCodeBackedSet<T extends HashCodeComparable> {
    private map: Map<number, T> = new Map<number, T>();
    public add(obj: T): T {
        if (!this.map.has(obj.hashCode())) {
            this.map.set(obj.hashCode(), obj);
        }
        return this.map.get(obj.hashCode());
    }
    public has(obj: T): boolean {
        return this.map.has(obj.hashCode());
    }
    public get(obj: T): T {
        return this.map.get(obj.hashCode());
    }
    public values(): T[] {
        return [...this.map.values()];
    }
}

export class PricePlansSet extends HashCodeBackedSet<PricePlanDefinition> {
    public addPricePlanIfNotExist(planName: string, cancelFeeInd: boolean, changeFeeInd: boolean, refundableInd: boolean, description: string[], checkedBags: number= 0, carryOnBags: number = 0): PricePlanDefinition {
        const pricePlan = new PricePlanDefinition(planName, cancelFeeInd, changeFeeInd, refundableInd, description, checkedBags, carryOnBags);
        if (!super.has(pricePlan)) {
            super.add(pricePlan);
        }
        return super.get(pricePlan);
    }
}
export class PricePlanDefinition implements HashCodeComparable {
    get planName(): string {
        return this._planName;
    }

    private _pricePlanID: string = generateUUID();
    private _planName: string;
    private _cancelFeeInd?: boolean;
    private _changeFeeInd?: boolean;
    private _refundableInd?: boolean;
    private _description: string[];     // TODO make this property immutable
    private _checkedBags: number;
    private _carryOnBags: number;

    constructor(planName: string, cancelFeeInd: boolean, changeFeeInd: boolean, refundableInd: boolean, description: string[], checkedBags: number, carryOnBags: number) {
        this._planName = planName;
        this._cancelFeeInd = cancelFeeInd;
        this._changeFeeInd = changeFeeInd;
        this._refundableInd = refundableInd;
        this._description = description;
        this._checkedBags = checkedBags;
        this._carryOnBags = carryOnBags;
    }
    get pricePlanID(): string {
        return this._pricePlanID;
    }
    get cancelFeeInd(): boolean|undefined {
        return this._cancelFeeInd;
    }

    get changeFeeInd(): boolean|undefined {
        return this._changeFeeInd;
    }

    get refundableInd(): boolean|undefined {
        return this._refundableInd;
    }

    get description(): string[] {
        return this._description;
    }

    get checkedBags(): number {
        return this._checkedBags;
    }

    get carryOnBags(): number {
        return this._carryOnBags;
    }

    public hashCode(): number {
        // generate hash code from meaningful product features
        return new HashCodeBuilder()
            .add(this._planName)
            .add(this._description)
            .add(this._cancelFeeInd)
            .add(this._changeFeeInd)
            .add(this._refundableInd)
            .add(this._checkedBags)
            .add(this._carryOnBags).hashCode();
    }

}
