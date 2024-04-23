import {
    NDCFlight,
    NDCFlightSegment,
    NDCOffer,
    NDCOfferItem,
    NDCOfferPriceRS,
    NDCPassenger,
    NDCPriceClassListItem
} from '../../interfaces/ndc';
import {ExtendedPriceDetails, Itinerary, Passenger, Segment} from '../../interfaces/glider';
import {convertToGliderPassenger, convertToGliderSegment} from '../../lib/ndc/ndcFormatUtils';
import {Mapping} from '../../lib/uuid';
import {BaseResponseBuilder} from './BaseResponseBuilder';
import {
    FareComponent,
    FareItem,
    FareItemType,
    PricedItem,
    PricedOffer,
    PricedOfferConstructorParameters,
    PricedOfferResponse,
    TaxItem
} from '../../interfaces/glider';
import {ExtendedSessionContext} from '../../services/ExtendedSessionContext';

export class OfferPriceResultsBuilder extends BaseResponseBuilder<PricedOfferResponse[]> {
    private ndcOfferPriceResponse: NDCOfferPriceRS;
    constructor(ndcOfferPriceResponse: NDCOfferPriceRS, existingMapping: Mapping|undefined = undefined) {
        super(existingMapping);
        this.ndcOfferPriceResponse = ndcOfferPriceResponse;
    }

    public build(sessionContext: ExtendedSessionContext): PricedOfferResponse[] {
        const offers: PricedOfferResponse[] = [];
        this.initialize();
        this.ndcOfferPriceResponse.PricedOffer.forEach(ndcPricedOffer => {
            const gliderOffer = this.convertNdcOffer(this.ndcOfferPriceResponse, ndcPricedOffer);
            offers.push(gliderOffer);
        });

        return offers;
    }

    /**
     * Initialize any additional data/structures that are needed (e.g. load currency metadata so that prices can be correctly created/converted)
     * @protected
     */
    protected initialize(): void {
        if (Array.isArray(this.ndcOfferPriceResponse.Metadata.CurrencyMetadata)) {
            // initialize currency metadata (decimal points) and conversion rates
            super.initializePriceConverter(this.ndcOfferPriceResponse.Metadata.CurrencyMetadata);
        }
    }
    protected convertNdcOffer(ndcOfferPriceResponse: NDCOfferPriceRS, ndcOffer: NDCOffer): PricedOfferResponse {

        const {TotalPrice: {Code: currencyCode, Total: totalPrice}} = ndcOffer;
        const price = super.convertPrice(totalPrice, currencyCode);
        const tax = super.convertPrice(this.calculateTotalTaxes(ndcOffer), currencyCode);
        const commission = super.convertPrice(this.calculateCommission(ndcOffer), currencyCode);

        const offerPrice = new ExtendedPriceDetails(price, currencyCode, commission, tax);
        const offerExpiration = ndcOffer.TimeLimits.OfferExpiration;

        const params: PricedOfferConstructorParameters = {
            price: offerPrice,
            expiration: offerExpiration,
            passengers: this.convertPassengers(ndcOfferPriceResponse.PassengerList),
            itinerary: this.convertSegments(ndcOffer, ndcOfferPriceResponse.FlightList, ndcOfferPriceResponse.FlightSegmentList ),
            pricedItems: this.convertOfferItems(ndcOffer.OfferItems),
            disclosures: this.extractDisclosures(ndcOfferPriceResponse, ndcOffer),
            terms: this.extractTerms(ndcOfferPriceResponse, ndcOffer),
            options: [],
        };
        const offerId = super.map(ndcOffer.OfferID);
        const pricedOffer = new PricedOffer(params);
        return new PricedOfferResponse(offerId, pricedOffer);
    }

    protected extractTerms(ndcOfferPriceResponse: NDCOfferPriceRS, ndcOffer: NDCOffer): string {
        let terms: string[] = [];
        // TODO only first offeritem is used to get terms&conditions, should be OK for AA but if offers are combined, outbound segment may have different conditrions than return segment
        const priceClassRef = ndcOffer.OfferItems[0].FareDetail.FareRules.PriceClassRef;
        const priceClassItem: NDCPriceClassListItem = ndcOfferPriceResponse.PriceClassList.find(priceClass => priceClass.PriceClassID === priceClassRef);
        if (priceClassItem && Array.isArray(priceClassItem.Description)) {
             terms = priceClassItem.Description;
        }
        return terms.join('\n');
    }

    protected extractDisclosures(ndcOfferPriceResponse: NDCOfferPriceRS, ndcOffer: NDCOffer): string[] {
        const remarks: string[] = [];
        ndcOffer.OfferItems.forEach(offerItem => {
            if (Array.isArray(offerItem.FareDetail.Remarks)) {
                remarks.push(...offerItem.FareDetail.Remarks);
            }
        });
        // remove dupes (sometimes same text is duplicated for two offeritems
        return [...new Set(remarks)];
    }

    protected convertSegments( ndcOffer: NDCOffer, ndcFlightsList: NDCFlight[], ndcSegmentsList: NDCFlightSegment[]): Itinerary {
        const gliderSegments: Map<string, Segment> = new Map<string, Segment>();
        ndcOffer.FlightsOverview.forEach(flightRef => {
            const flightKeys = flightRef.FlightRef.split(' ');
            flightKeys.forEach(flightKey => {
                const ndcFlight = ndcFlightsList.find(flight => (flight.FlightKey === flightKey));
                const segmentKeys = ndcFlight.SegmentReferences.split(' ');
                segmentKeys.forEach(segmentKey => {
                    const ndcSegment = ndcSegmentsList.find(segment => segment.SegmentKey === segmentKey);
                    const gliderSegment = convertToGliderSegment(ndcSegment);
                    const mappedSegmentKey = this.map(segmentKey);
                    gliderSegments.set(mappedSegmentKey, gliderSegment);
                });
            });

        });
        return new Itinerary(gliderSegments);
    }

    protected convertPassengers(passengerList: NDCPassenger[]): Map<string, Passenger> {
        const results = new Map<string, Passenger>();
        // iterate over passengers list and convert NDC Pax format to Glider Pax format
        passengerList.forEach(ndcPax => {
            const ndcPaxId = ndcPax.PassengerID;    // we can retain IDs
            const gliderPax = convertToGliderPassenger(ndcPax);
            results.set(ndcPaxId, gliderPax);
        });
        return results;
    }

    protected calculateTotalTaxes(ndcOffer: NDCOffer): number {
        let totalTax = 0;
        ndcOffer.OfferItems.forEach(offerItem => {
            let paxCountForOfferItem = 1;
            if (offerItem.Service && offerItem.Service.PassengerRefs) {
                paxCountForOfferItem = offerItem.Service.PassengerRefs.split(' ').length;
            }
            totalTax += Number(offerItem.FareDetail.Price.Taxes.Total.Total) * paxCountForOfferItem;
        });
        return totalTax;
    }
    // TODO make commission configurable
    protected calculateCommission(ndcOffer: NDCOffer): number {
        return 0;
    }

    protected extractFareItems(ndcOfferItem: NDCOfferItem): FareItem[] {
        const fareItems: FareItem[] = [];

        // convert base fare info
        const baseAmount = ndcOfferItem.FareDetail.Price.BaseAmount;
        if (baseAmount && baseAmount.Total > 0) {
            const baseItem: FareItem = new FareItem();
            baseItem.amount = super.convertPrice(baseAmount.Total, baseAmount.Code);
            baseItem.usage = FareItemType.base;
            baseItem.description = 'Base amount';
            fareItems.push(baseItem);
            // add RBD info (TODO - is this the right place?)
            baseItem.components = [];
            const rbdInfo = new FareComponent();
            rbdInfo.basisCode = ndcOfferItem.FareDetail.FareBasis.FareBasisCode;
            rbdInfo.designator = ndcOfferItem.FareDetail.FareBasis.RBD;
            rbdInfo.name = ndcOfferItem.FareDetail.FareBasis.CabinTypeName;
            baseItem.components.push(rbdInfo);
        }

        // convert surcharges fare info
        const surchargeAmount = ndcOfferItem.FareDetail.Price.Surcharges;
        if (surchargeAmount && surchargeAmount.Total > 0) {
            const surchargeItem: FareItem = new FareItem();
            surchargeItem.amount = super.convertPrice(surchargeAmount.Total, surchargeAmount.Code);
            surchargeItem.usage = FareItemType.surcharge;
            surchargeItem.description = 'Surcharge';
            fareItems.push(surchargeItem);
        }

        return fareItems;
    }

    private convertOfferItems(ndcOfferItems: NDCOfferItem[]): PricedItem[] {
        const gliderPricedItems: PricedItem[] = [];
        ndcOfferItems.forEach(ndcOfferItem => {
            const gliderPricedItem: PricedItem = new PricedItem();
            if (ndcOfferItem.FareDetail && ndcOfferItem.FareDetail.Price && ndcOfferItem.FareDetail.Price.Taxes && Array.isArray(ndcOfferItem.FareDetail.Price.Taxes.Breakdown)) {
                gliderPricedItem.taxes = ndcOfferItem.FareDetail.Price.Taxes.Breakdown.map(tax => {
                    const taxTotal = super.convertPrice(tax.Amount.Total, tax.Amount.Code);
                    return new TaxItem(taxTotal, tax.Amount.Code, tax.TaxCode, tax.Description);
                });
                gliderPricedItem.fare = this.extractFareItems(ndcOfferItem);
                if (ndcOfferItem.Service && ndcOfferItem.Service.PassengerRefs) {
                    gliderPricedItem.passengerRefs = ndcOfferItem.Service.PassengerRefs.split(' ');
                }

                gliderPricedItem.segmentRefs = [];
                if (ndcOfferItem.Service && ndcOfferItem.Service.FlightRefs) {
                    const flightRefs = ndcOfferItem.Service.FlightRefs.split(' ');
                    flightRefs.map(ndcFlightRef => {
                        const ndcFlight = this.ndcOfferPriceResponse.FlightList.find(flight => flight.FlightKey === ndcFlightRef);
                        const segmentRef = (ndcFlight && ndcFlight.SegmentReferences) ? ndcFlight.SegmentReferences : undefined;
                        if (segmentRef) {
                            gliderPricedItem.segmentRefs.push(super.map(segmentRef));
                        }
                    });
                    // gliderPricedItem.flightRefs = ;
                }

            }
            gliderPricedItems.push(gliderPricedItem);
        });

        return gliderPricedItems;
    }
}
