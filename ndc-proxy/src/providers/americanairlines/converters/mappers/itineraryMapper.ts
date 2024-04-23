import {FlightSearchCriteria} from '../../../../interfaces/glider';
import {NDCItineraryCriteria} from '../../../../interfaces/ndc';
import {convertToDateString, convertToDateStringWithTimezone, DateFormat} from '../../../../lib/utils/DateUtils';

export function convertFromGliderItineraries(itineraryCriteria: FlightSearchCriteria): NDCItineraryCriteria[] {
    const ndcItins: NDCItineraryCriteria[] = [];
    const segments = itineraryCriteria.segments;
    let odId = 1;
    for (const segment of segments) {
        const travelDte = segment.isLocalDepartureTimeRequested ? convertToDateString(segment.departureTime, DateFormat.YYYY_MM_DD) : convertToDateStringWithTimezone(segment.departureTime, segment.origin.iataCode, DateFormat.YYYY_MM_DD);
        const ndcItin: NDCItineraryCriteria = {
            origin: segment.origin.iataCode,
            destination: segment.destination.iataCode,
            travelDate: travelDte,
            // travelDate: convertToDateString(segment.departureTime, DateFormat.YYYY_MM_DD),
            odKey: `OD${odId++}`,
        };
        ndcItins.push(ndcItin);
    }
    return ndcItins;
}
