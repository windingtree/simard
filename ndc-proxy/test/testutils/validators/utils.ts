import {
    SearchResults,
} from '../../../src/interfaces/glider';

export function getFlightIDsOfOffer(offerId: string, searchResults: SearchResults): string[] {
    const offer = searchResults.offers[offerId];
    const flightIDs: string[] = [];
    Object.keys(offer.pricePlansReferences).forEach(pricePlanId => {
        flightIDs.push(... offer.pricePlansReferences[pricePlanId].flights);
    });
    return [...new Set(flightIDs)];
}

export function getSegmentIDsOfOffer(offerId: string, searchResults: SearchResults): string[] {
    const flightIDs: string[] = getFlightIDsOfOffer(offerId, searchResults);
    const segmentIDs: string[] = [];
    flightIDs.forEach(flightId => {
        const ids: string[] = searchResults.itineraries.combinations[flightId];
        segmentIDs.push(...ids);
    });
    return [...new Set(segmentIDs)];
}

// helper to get a list of keys from either regular hashmap or Map<string, any>
// it's needed as sometimes we need to iterate over Map (e.g. shopping results as Glider objects that contain Map<string, Offer)) and sometimes over JSON (where we have regular hashmap)
export function keys(obj: any): string[] {
    if (obj instanceof Map) {
        const asMap = obj as Map<string, any>;
        return [...asMap.keys()];
    }
    return Object.keys(obj);
}

// this is to get value from either hashmap or Map<sting, any>
// it's needed as sometimes we need to iterate over Map (e.g. shopping results as Glider objects that contain Map<string, Offer)) and sometimes over JSON (where we have regular hashmap)
export function getMapValue<T>(obj: any, key: string): T {
    if (obj instanceof Map) {
        const asMap = obj as Map<string, any>;
        return asMap.get(key);
    }
    return obj[key];
}
