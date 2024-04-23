import {NDCFlightSegment, NDCOffer, NDCOfferPriceRS} from '../../../../interfaces/ndc';

export function collectSegmentsForSeatmapRequest(offer: NDCOffer, offerPriceRS: NDCOfferPriceRS): string[] {
    const flightRefs: string[] = offer.FlightsOverview.map(flightRef => flightRef.FlightRef);
    const segmentsFromOffer: NDCFlightSegment[] = [];
    flightRefs.forEach(flightRef => {
        const flight = offerPriceRS.FlightList.find(flightKey => flightKey.FlightKey === flightRef);
        const segmentReferences: string[] = flight.SegmentReferences.split(' ');
        const segments: NDCFlightSegment[] = segmentReferences.map(segmentKey => {
            return offerPriceRS.FlightSegmentList.find(flightSegment => flightSegment.SegmentKey === segmentKey);
        });
        segmentsFromOffer.push(...segments);
    });

    const onlyOperatingCarrierSegments = segmentsFromOffer.filter(segment => {
        if (segment.OperatingCarrier && segment.OperatingCarrier.AirlineID && segment.OperatingCarrier.AirlineID.length > 0) {
            return segment.OperatingCarrier.AirlineID === segment.MarketingCarrier.AirlineID;
        }
        return true; //
    });
    const operatingSegmentRefs = onlyOperatingCarrierSegments.map(value => value.SegmentKey);
    return operatingSegmentRefs;
}
