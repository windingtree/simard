import {Offer, PricePlanReference, SearchResults, Segment} from '../../../src/interfaces/glider';
import {getMapValue, keys} from '../validators';
import {OfferItinerary} from './OfferItinerary';
import {OfferDetails} from './OfferDetails';

/**
 * Helper function to get offer details from search results - it returns offer, itineraries, segments
 */
export function deconstructOfferDetails(searchResults: SearchResults, offerId: string): OfferDetails {
    const itineraries: OfferItinerary[] = [];
    const offer: Offer = getMapValue(searchResults.offers, offerId);
    keys(offer.pricePlansReferences).forEach(pricePlanRefId => {
        const pricePlanRef: PricePlanReference = getMapValue(offer.pricePlansReferences, pricePlanRefId);
        pricePlanRef.flights.forEach(itineraryID => {
            const segmentsIDs: string[] = getMapValue(searchResults.itineraries.combinations, itineraryID);
            const itinerary: OfferItinerary = {
                segments: [],
                segmentIDs: [],
            };
            segmentsIDs.forEach(segmentsID => {
                const segment: Segment = getMapValue(searchResults.itineraries.segments, segmentsID);
                itinerary.segments.push(segment);
                itinerary.segmentIDs.push(segmentsID);
            });
            itineraries.push(itinerary);
        });
    });

    return {
        offerId,
        offer,
        itineraries,
    };
}
