import {
    NDCALaCarteOfferItem,
    NDCCabin,
    NDCCabinRow,
    NDCSeat,
    NDCSeatAvailabilityRS,
    NDCSeatMap, NDCFlightSegment, NDCOfferPriceRS, NDCServiceDefinition
} from '../../interfaces/ndc';
import {BaseResponseBuilder} from './BaseResponseBuilder';
import {Mapping} from '../../lib/uuid';
import {CabinMap, Seat, SeatMap, SeatMapResponse, ExtendedPriceDetails, SeatMetadata} from '../../interfaces/glider';
import {SeatPricesManager} from './converters/seatavailability/SeatPricesManager';
import {FarelogixConfiguration} from '../../env';
import {getStaticSeatDescriptions} from './staticDescriptionUtils';
const DEFAULT_CURRENCY_CODE = 'USD';

/**
 * Creates /seatmap response.
 * It converts NDC SeatAvailabilityRS to a Glider format
 *
 */
export class SeatMapResponseBuilder extends BaseResponseBuilder<SeatMapResponse> {

    private static getSeatMarketingDescription(carrierCode: string, seatServiceDefinition: NDCServiceDefinition): string[] {
        return getStaticSeatDescriptions(carrierCode, seatServiceDefinition.Name);
    }
    private readonly seatAvailRS: NDCSeatAvailabilityRS;
    private offerPriceRS: NDCOfferPriceRS;
    private flxConfig: FarelogixConfiguration;

    constructor(flxConfig: FarelogixConfiguration, seatAvailRS: NDCSeatAvailabilityRS, offerPriceRS: NDCOfferPriceRS, existingMapping: Mapping|undefined = undefined) {
        super(existingMapping);
        this.flxConfig = flxConfig;
        this.seatAvailRS = seatAvailRS;
        this.offerPriceRS = offerPriceRS;
    }

    public build(): SeatMapResponse {
        this.initialize();
        const response = new SeatMapResponse();
        response.seatmaps = this.buildSeatMaps(this.seatAvailRS.SeatMaps);
        return  response;
    }
    /**
     * Initialize any additional data/structures that are needed (e.g. load currency metadata so that prices can be correctly created/converted)
     * @protected
     */
    protected initialize(): void {
        if (Array.isArray(this.seatAvailRS.Metadata.CurrencyMetadata)) {
            // initialize currency metadata (decimal points) and conversion rates
            super.initializePriceConverter(this.seatAvailRS.Metadata.CurrencyMetadata);
        }
    }
    protected findSegmentBySegmentKey(segmentKey: string): NDCFlightSegment {
        return this.seatAvailRS.FlightSegmentList.find(segment => segment.SegmentKey === segmentKey);
    }

    /**
     * For a given flight segment return it's unique Glider identifier.
     * @param ndcSegment
     * @protected
     */
    protected createSegmentIndexKey(ndcSegment: NDCFlightSegment): string {
        const segmentFromPricingResponse = this.offerPriceRS.FlightSegmentList.find(segment => {
            return (segment.Departure.AirportCode === ndcSegment.Departure.AirportCode &&
                segment.Arrival.AirportCode === ndcSegment.Arrival.AirportCode &&
                segment.MarketingCarrier.AirlineID === ndcSegment.MarketingCarrier.AirlineID &&
                segment.Departure.Date === ndcSegment.Departure.Date &&
                segment.MarketingCarrier.FlightNumber === ndcSegment.MarketingCarrier.FlightNumber
            );
        });
        const segmentKeyFromPricingResponse = segmentFromPricingResponse.SegmentKey;
        return this.map(segmentKeyFromPricingResponse);
    }

    private buildSeatMaps(ndcSeatMaps: NDCSeatMap[]): Map<string, SeatMap> {
        const result = new Map<string, SeatMap>();

        // iterate over segments (single seatmap = segment)
        ndcSeatMaps.forEach(ndcSeatMap => {
            const segmentKey = ndcSeatMap.SegmentRef;
            const segment: NDCFlightSegment = this.findSegmentBySegmentKey(segmentKey);
            const segmentIndexKey = this.createSegmentIndexKey(segment);
            // convert segment cabins from NDC format to Glider
            const gliderSegmentCabins: CabinMap[] = [];

            // extract AlaCarteOfferItems that are eligible only for this segment (we need to create prices only for this segment only)
            const thisSegmentOfferItems: NDCALaCarteOfferItem[] = this.seatAvailRS.ALaCarteOffer.ALaCarteOfferItems.filter(value => value.Eligibility.SegmentRefs === ndcSeatMap.SegmentRef);
            const thisSegmentOfferItemsMap: Map<string, NDCALaCarteOfferItem> = new Map<string, NDCALaCarteOfferItem>();
            thisSegmentOfferItems.forEach(ndcOfferItem =>  thisSegmentOfferItemsMap.set(ndcOfferItem.OfferItemID, ndcOfferItem));

            // create options codes( = offers/prices) for every seat
            // each seat may have different price depending on a passenger (e.g. seat 10A may cost 10$ for pax1 and 20$ for pax2)
            // since Glider API does not offer possibility to specify what is a price of a seat for a specific passenger, we need to return the highest price for a specific seat
            // e.g. from NDC we get that seat 10A costs 10$ for pax1 and 20$ for pax2, glider should return 20$ for seat 10A
            // that's why we need to find max price for a seat, generate option code for that and assign this price to option code and option code to a seat
            const seatPricesManager = new SeatPricesManager();

            // each distinct seat type should have a marketing description which explains what benefits/amenities are included for that seat
            // in NDC terms those are distinct seats are elements of DataList/ServiceDefinitionList/ServiceDefinition
            // for every segment we need to create a map (key is optionCode) with marketing information (text)
            const segmentSeatsMarketingDescriptions = new Map<string, string[]>();
            ndcSeatMap.cabins.forEach(ndcCabin => {
                const gliderCabinSeats: Seat[] = [];    // list of seats of a given cabin

                ndcCabin.Rows.forEach(ndcRow => {
                    // 1) iterate over seats
                    ndcRow.Seats.forEach(ndcSeat => {
                        // 2) for every seat find max price (if there are 2 or more passengers shopping for a price)
                        const seatOfferItemRefs = ndcSeat.OfferItemRefs.split(' ');
                        let seatOfferItemWithHighestPrice = thisSegmentOfferItemsMap.get(seatOfferItemRefs[0]); // take first item initially
                        seatOfferItemRefs.find(value => {
                            const candidate = thisSegmentOfferItemsMap.get(value);
                            if (candidate.UnitPriceDetail.TotalAmount.Total > seatOfferItemWithHighestPrice.UnitPriceDetail.TotalAmount.Total) {
                                seatOfferItemWithHighestPrice = candidate;
                            }
                        });
                        // 3) find what is this seat type (in service name, e.g. extra legroom, preferred seat)
                        const serviceDefinitionRef = seatOfferItemWithHighestPrice.Service.ServiceDefinitionRef;
                        const seatServiceDefinition = this.seatAvailRS.ServiceDefinitions.find(value => value.ServiceDefinitionID === serviceDefinitionRef);
                        const seatType = seatServiceDefinition.Name;
                        const seatPrice = this.createPrice(seatOfferItemWithHighestPrice);
                        // 4) get an option code for each distinct price and seat type
                        const seatOptionCode = seatPricesManager.addPrice(seatType, seatPrice);

                        const gliderSeat = this.convertSeat(ndcRow, ndcSeat, seatOptionCode);

                        // TODO: get actual marketing details including just seatName for now
                        gliderSeat.seatMetadata = new SeatMetadata();
                        gliderSeat.seatMetadata.seatName = seatType;

                        // 5) get marketing text for this seat type (serviceDefinition)
                        const seatMarketingData = SeatMapResponseBuilder.getSeatMarketingDescription(this.flxConfig.airlineCode, seatServiceDefinition);
                        segmentSeatsMarketingDescriptions.set(seatOptionCode, seatMarketingData);

                        gliderCabinSeats.push(gliderSeat);  // add seat to a cabin seats
                    });
                });
                const gliderCabin: CabinMap = this.convertToCabinMap(ndcCabin);
                gliderCabin.seats = gliderCabinSeats;
                gliderSegmentCabins.push(gliderCabin);  // list of cabins of a given segment

            });
            const gliderSeatMap: SeatMap = new SeatMap();
            gliderSeatMap.cabins = gliderSegmentCabins;
            gliderSeatMap.prices = seatPricesManager.getPrices();
            gliderSeatMap.descriptions = segmentSeatsMarketingDescriptions;
            // add segment seatmap to a map (key = segmentIdex, value = seatmap)
            result.set(segmentIndexKey, gliderSeatMap);
        });

        return result;
    }

    private createPrice(ndcOfferItem: NDCALaCarteOfferItem): ExtendedPriceDetails {
        let totalCurrencyCode = ndcOfferItem.UnitPriceDetail.TotalAmount.Code;
        if ((!totalCurrencyCode || totalCurrencyCode.length === 0) && ndcOfferItem.UnitPriceDetail.TotalAmount.Total === 0) {
            // AA workaround - for international flights, seatmap prices come with 0 price and no currency code
            // in this case we can simply return 0USD price
            totalCurrencyCode = DEFAULT_CURRENCY_CODE;
        }
        const taxes = super.convertPrice(ndcOfferItem.UnitPriceDetail.Taxes.Total, totalCurrencyCode);
        const totalAmount = super.convertPrice(ndcOfferItem.UnitPriceDetail.TotalAmount.Total, totalCurrencyCode);
        return new ExtendedPriceDetails(totalAmount, totalCurrencyCode, 0, taxes);
    }
    private convertToCabinMap(ndcCabin: NDCCabin): CabinMap {
        const ndcCabinLayout = ndcCabin.CabinLayout;
        const gliderCabinMap: CabinMap = new CabinMap();
        gliderCabinMap.firstRow = ndcCabinLayout.RowFirst;
        gliderCabinMap.lastRow = ndcCabinLayout.RowLast;
        // gliderCabinMap.exitRows=ndcCabinLayout.;
        // gliderCabinMap.wingFirst=ndcCabinLayout.;
        // gliderCabinMap.wingLast=ndcCabinLayout.;
        gliderCabinMap.layout = ndcCabinLayout.Columns.map(col => col.Value).join('');
        gliderCabinMap.aisleColumns = ndcCabin.CabinLayout.Columns.filter(col => col.Position === 'A').map(value => value.Value); // column with position=A means Aisle
        gliderCabinMap.name = ndcCabin.CabinTypeCode;   // TODO map cabin type code to name
        // gliderCabinMap.seats = this.convertToSeats(ndcCabin.Rows);
        return gliderCabinMap;
    }

    private convertSeat(ndcRow: NDCCabinRow, ndcSeat: NDCSeat, optionCode: string): Seat {
        const gliderSeat = new Seat();
        gliderSeat.row = ndcRow.Number;
        gliderSeat.column = ndcSeat.Column;
        gliderSeat.number = `${ndcRow.Number}${ndcSeat.Column}`;
        gliderSeat.characteristics = ndcSeat.SeatCharacteristics;
        gliderSeat.available = ['A'].includes(ndcSeat.SeatStatus);
        gliderSeat.optionCode = optionCode;
        return gliderSeat;
    }
}
