import {NDCFlightSegment, NDCOffer} from '../../../../interfaces/ndc';
import {SeatMapMetadataContainer} from '../../metadata/SeatMapMetadataContainer';
import {convertSeatOptions} from '../seatavailability';
import {PricingMetadataContainer} from '../../metadata/PricingMetadataContainer';
import {UUIDMapper} from '../../../../lib/uuid';
import {SeatOfferItemWithPrice} from '../seatavailability/SeatOfferItemWithPrice';

export function buildSeatOfferItems(seatMapMetadata: SeatMapMetadataContainer, pricingMetadata: PricingMetadataContainer): NDCOffer {
    const optionsSelection = pricingMetadata.optionSelection;
    if (!optionsSelection) {   // if there was no seats selected, no need to create NDCOfferItems - return
        return undefined;
    }

    // TODO potentially there may be more shopping offer IDs - add support for that case
    // first we need to get mapping between Glider Segment ID and NDC segment, so that we know for which segment user want to book seats
    const mapper = new UUIDMapper(pricingMetadata.mapping);
    const ndcOfferItems: SeatOfferItemWithPrice[] = [];
    optionsSelection.forEach(option => {
        const gliderSegmentId = option.segment;
        const ndcPricingSegmentId = mapper.reverse(gliderSegmentId);
        const ndcSegmentFromPricing = findSegmentById(ndcPricingSegmentId, pricingMetadata.pricingResponse.OfferPriceRS.FlightSegmentList);
        const ndcSegmentFromSeatmap = findSegmentByDetails(ndcSegmentFromPricing.Departure.AirportCode, ndcSegmentFromPricing.Arrival.AirportCode, ndcSegmentFromPricing.Departure.Date, ndcSegmentFromPricing.MarketingCarrier.AirlineID, ndcSegmentFromPricing.MarketingCarrier.FlightNumber, seatMapMetadata.seatMapResponse.SeatAvailabilityRS.FlightSegmentList);
        const optionNDCOfferItem: SeatOfferItemWithPrice = convertSeatOptions(option.passenger, option.seatNumber, ndcSegmentFromSeatmap.SegmentKey, seatMapMetadata.seatMapResponse.SeatAvailabilityRS);
        ndcOfferItems.push(optionNDCOfferItem);
    });
    const ndcOffer = new NDCOffer();
    ndcOffer.OfferID = seatMapMetadata.seatMapResponse.SeatAvailabilityRS.ALaCarteOffer.OfferID;
    ndcOffer.ResponseID = seatMapMetadata.seatMapResponse.SeatAvailabilityRS.ShoppingResponseID.ResponseID;
    ndcOffer.Owner = seatMapMetadata.seatMapResponse.SeatAvailabilityRS.ALaCarteOffer.Owner;
    ndcOffer.OfferItems = ndcOfferItems;
    return ndcOffer;
}

function findSegmentById(segmentKey: string, flightSegmentList: NDCFlightSegment[]): NDCFlightSegment {
    const segment = flightSegmentList.find(value => value.SegmentKey === segmentKey);
    if (!segment) {
        throw new Error(`Invalid segment ID, cannot find requested segment:${segmentKey}`);
    }
    return segment;
}

function findSegmentByDetails(departureAirportCode: string, arrivalAirportCode: string, departureDate: string, marketingAirlineID: string, marketingFlightNumber: string, flightSegmentList: NDCFlightSegment[]): NDCFlightSegment {
    const result = flightSegmentList.find(segment => {
        return (segment.Departure.AirportCode === departureAirportCode &&
            segment.Arrival.AirportCode === arrivalAirportCode &&
            segment.MarketingCarrier.AirlineID === marketingAirlineID &&
            segment.Departure.Date === departureDate &&
            segment.MarketingCarrier.FlightNumber === marketingFlightNumber
        );
    });
    if (!result) {
        throw new Error(`Invalid segment ID, cannot find requested segment:${marketingAirlineID}${marketingFlightNumber}`);
    }
    return result;
}

export function calculateTotalSeatsPrice(seatMapMetadata: SeatMapMetadataContainer, pricingMetadata: PricingMetadataContainer): number {
    let totalSeatPrice = 0;
    if (!seatMapMetadata) {
        return 0;
    }
    const ndcSeatSelectionOffer: NDCOffer = buildSeatOfferItems(seatMapMetadata, pricingMetadata);
    const selectedSeatWithPrices: SeatOfferItemWithPrice[] = ndcSeatSelectionOffer.OfferItems as SeatOfferItemWithPrice[];
    const ndcSeatPrices = selectedSeatWithPrices.map(value => value.UnitPriceDetail.TotalAmount);

    if (ndcSeatPrices.length > 0) {
        ndcSeatPrices.forEach(value => totalSeatPrice += value.Total);
    }

    return totalSeatPrice;
}
