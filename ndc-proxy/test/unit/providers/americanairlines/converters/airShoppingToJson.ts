import fs from 'fs';
import path from 'path';
import {
    NDCAirShoppingResponse,
    NDCBaggageAllowanceListItem, NDCFlightSegment
} from '../../../../../src/interfaces/ndc';
import {processAirShoppingRS} from '../../../../../src/providers/americanairlines/converters/airshopping';

// sample utility to help understanding AirShoppingRS
// it converts AirShoppingRS XML into JSON and simplifies data (e.g. removes segment data with flight number only)

// segments index
const segments = new Map<string, string>();
// flights index
const flights = new Map<string, string>();
// baggage allowance index
const baggageAllowances = new Map<string, string>();
// passengers index
const passengers = new Map<string, string>();
// price class index
const priceClassIndex = new Map<string, string>();

// helpers to convert objects to string
const segmentToString = (segment: NDCFlightSegment): string => `${segment.MarketingCarrier.AirlineID}${segment.MarketingCarrier.FlightNumber}`;
const baggageAllowanceToString = (allowance: NDCBaggageAllowanceListItem): string => `${allowance.PieceAllowance.TotalQuantity} ${allowance.BaggageCategory}(${allowance.BaggageDeterminingCarrier.AirlineID})`;
// load input file and transform to NDC format
const loadAirShoppingRS = async (filename: string): Promise<NDCAirShoppingResponse> => {
    // read XML from a file
    const xml = fs.readFileSync(path.join(__dirname, filename), 'utf8');
    return await processAirShoppingRS(xml);
};

// load XML file with AirShoppingRS, convert to NDC format, process it and create necessary indexes
const createIndexes = async (ndcResponse: NDCAirShoppingResponse) => {
    // create segments index
    ndcResponse.AirShoppingRS.FlightSegmentList.forEach(segment => {
        segments.set(segment.SegmentKey, segmentToString(segment));
    });
    // create flights index
    ndcResponse.AirShoppingRS.FlightList.forEach(flight => {
        flights.set(flight.FlightKey, flight.SegmentReferences.split(' ').map(segmentRef => segments.get(segmentRef)).join(','));
    });
    // create baggage allowances index
    ndcResponse.AirShoppingRS.BaggageAllowanceList.forEach(allowance => {
        baggageAllowances.set(allowance.BaggageAllowanceID, baggageAllowanceToString(allowance));
    });
    // create passengers index
    ndcResponse.AirShoppingRS.PassengerList.forEach(passenger => {
        passengers.set(passenger.PassengerID, `${passenger.type}`);
    });
    // create price class index
    ndcResponse.AirShoppingRS.PriceClassList.forEach(priceClass => {
        priceClassIndex.set(priceClass.PriceClassID, `${priceClass.Code}/${priceClass.Name}`);
    });
};

const convertAirShoppingToJson = async (filename: string): Promise<void> => {
    const ndcResponse = await loadAirShoppingRS(filename);
    await createIndexes(ndcResponse);
    const offers = ndcResponse.AirShoppingRS.AirlineOffers.map(offer => {
        // iterate over allowances and convert it to easily readable object
        const allowances = offer.BaggageAllowance.map(allowance => {
            return {
                allowance: baggageAllowances.get(allowance.BaggageAllowanceRef),
                passengers: allowance.PassengerRefs.split(' ').map(passengerID => passengers.get(passengerID)).join(' '),
                flights: allowance.FlightRefs.split(' ').map(flightID => flights.get(flightID)).join('|'),
            };
        });

        const offerItems = offer.OfferItems.map(offerItem => {
            return {
                offerItemID: offerItem.OfferItemID,
                passengers: offerItem.Service.PassengerRefs.split(' ').map(passengerID => passengers.get(passengerID)).join(' '),
                flights: offerItem.Service.FlightRefs.split(' ').map(flightID => flights.get(flightID)).join('|'),
                cabin: `${offerItem.FareDetail.FareBasis.CabinTypeCode}/${offerItem.FareDetail.FareBasis.CabinTypeName}`,
                priceClassRef: `${offerItem.FareDetail.FareRules.PriceClassRef}`,
                priceClass: priceClassIndex.get(offerItem.FareDetail.FareRules.PriceClassRef),
                refundable: offerItem.FareDetail.FareRules.Penalty.RefundableInd,
                cancelFee: offerItem.FareDetail.FareRules.Penalty.CancelFeeInd,
                changeFee: offerItem.FareDetail.FareRules.Penalty.ChangeFeeInd,
                remarks: (offerItem.FareDetail.Remarks ? offerItem.FareDetail.Remarks.join(';') : ''),
            };
        });
        return {
            offerID: offer.OfferID,
            allowances,
            offerItems,
        };
    });
// const flights = offer.FlightsOverview.map(flight=>flight.FlightRef)
    fs.writeFileSync(path.join(__dirname, `${filename}.json`), JSON.stringify(offers, undefined, 2));
};

// const filename = 'AirShoppingRS_JFKDFW_1ADT_1CNN_OneWay.xml';
// const filename = 'AirShoppingRS.xml';

convertAirShoppingToJson('AirShoppingRS_SEA_KRK_roundtrip.xml')
    .then(() => {
        console.log('Completed');
    })
    .catch((err) => {
        console.log('Failed:', err.message);
    });
