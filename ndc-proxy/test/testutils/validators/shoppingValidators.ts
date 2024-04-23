import {
    Offer, Passenger,
    PricePlan,
    PricePlanReference, SearchCriteria,
    SearchResults,
    Segment
} from '../../../src/interfaces/glider';
import moment from 'moment';
import {getMapValue, keys} from './utils';

export function validateSearchResults(searchResults: SearchResults, searchCriteria: SearchCriteria): void {
    validatePricePlans(searchResults);
    validateOffers(searchResults);
    validateItineraries(searchResults);
    validatePassengers(searchResults);

    // passengers from search response should match with those in search criteria
    expect(keys(searchResults.passengers).length).toEqual(searchCriteria.passengers.length);
    // TODO add better validation of passengers
}

/**
 * Validate single offer from /offers/search response
 */
export function validateSingleOffer(searchResults: SearchResults, offer: Offer): void {
    try {
        expect(offer.expiration).not.toBeUndefined();

        // expiration date should be in he future
        // expect(moment(offer.expiration).isSameOrAfter(moment())).toBeTruthy();   //TODO - uncomment (in unit tests 'expiration' contains past date(from NDC response)
        // but not later than 7 days from now
        // expect(moment(offer.expiration).isSameOrBefore(moment().add(1, 'days'))).toBeTruthy();   //TODO - uncomment (in unit tests 'expiration' contains past date(from NDC response)

        expect(offer.price.public).toBeGreaterThan(0);
        expect(offer.price.public).toBeLessThan(100000);

        expect(offer.price.currency).toHaveLength(3);

        expect(offer.price.taxes).toBeGreaterThan(0);

        expect(keys(offer.pricePlansReferences).length).toBeGreaterThan(0);
// validate offer price plan references
        keys(offer.pricePlansReferences).forEach(planRefId => {
            const pricePlanReference: PricePlanReference = getMapValue(offer.pricePlansReferences, planRefId);
            validateSinglePlanReference(searchResults, pricePlanReference);
            // make sure price plan exists
            const pricePlan = getMapValue(searchResults.pricePlans, planRefId);
            expect(pricePlan).not.toBeUndefined();
        });
    } catch (err: any) {
        console.log('offer', offer);
        throw err;
    }
}

export function validateSinglePlanReference(searchResults: SearchResults, pricePlanReference: PricePlanReference): void {
    // make sure price plan reference exists
    expect(pricePlanReference).not.toBeUndefined();
    // it's flights cannot be empty (in case of air offer)
    expect(pricePlanReference.flights.length).toBeGreaterThan(0);
    // make sure flight exists
    pricePlanReference.flights.forEach(flightRef => {
        const combinations: string[] = getMapValue<string[]>(searchResults.itineraries.combinations, flightRef);
        expect(combinations).not.toBeUndefined();
    });

}

// validate all offers from search results
export function validateOffers(searchResults: SearchResults): void {
    expect(keys(searchResults.offers).length).toBeGreaterThan(0);
    keys(searchResults.offers).forEach(offerId => {
        const offer: Offer = getMapValue<Offer>(searchResults.offers, offerId);
        validateSingleOffer(searchResults, offer);
    });
}

// validate single price plan
export function validateSinglePricePlan(pricePlan: PricePlan): void {
    // expect(pricePlan.amenities.length).toBeGreaterThan(0);
    pricePlan.amenities.forEach(amenity => {
        // expect(amenity).toBeTruthy();         //TODO - uncomment this
    });
    expect(pricePlan.checkedBaggages.quantity).toBeGreaterThan(-1);
    expect(pricePlan.name).not.toBeUndefined();
    // expect(pricePlan.description).not.toBeUndefined();    //TODO - uncomment this
}

// validate all price plans from search results
export function validatePricePlans(searchResults: SearchResults): void {
    expect(keys(searchResults.pricePlans).length).toBeGreaterThan(0);

    keys(searchResults.pricePlans).forEach(pricePlanId => {
        const pricePlan: PricePlan = getMapValue<PricePlan>(searchResults.pricePlans, pricePlanId);
        try {
            validateSinglePricePlan(pricePlan);
        } catch (err: any) {
            console.log('pricePlanId', pricePlanId);
            console.log('pricePlan', pricePlan);
            throw err;
        }
    });
}

export function validateSegment(segment: Segment): void {
    expect(segment.operator.operatorType).not.toBeUndefined();
    expect(segment.operator.iataCode).toHaveLength(2);
    expect(segment.operator.flightNumber).not.toBeUndefined();
    expect(segment.operator.flightNumber.length).toBeGreaterThan(2);

    expect(segment.origin.locationType).not.toBeUndefined();
    expect(segment.origin.iataCode).toHaveLength(3);

    expect(segment.destination.locationType).not.toBeUndefined();
    expect(segment.destination.iataCode).toHaveLength(3);

    expect(moment(segment.departureTime).isValid()).toBeTruthy();
    expect(moment(segment.arrivalTime).isValid()).toBeTruthy();

    expect(moment(segment.departureTime).isBefore(moment(segment.arrivalTime)));

    // make sure origin!=destination
    expect(segment.origin.iataCode).not.toEqual(segment.destination.iataCode);
}

// validate all flights from search results
export function validateItineraries(searchResults: SearchResults): void {
    expect(keys(searchResults.itineraries.combinations).length).toBeGreaterThan(1);
    expect(keys(searchResults.itineraries.segments).length).toBeGreaterThan(1);

    // iterate over combinations
    keys(searchResults.itineraries.combinations).forEach(combinationId => {
        const combinations = getMapValue<string[]>(searchResults.itineraries.combinations, combinationId);
        // combination has to have segments
        expect(combinations.length).toBeGreaterThan(0);
        combinations.forEach(segmentRef => {
            const segment: Segment = getMapValue(searchResults.itineraries.segments, segmentRef);
            // make sure segment exists
            expect(segment).not.toBeUndefined();
        });
    });

    // iterate over segments and check each of them
    keys(searchResults.itineraries.segments).forEach(segmentId => {
        const segment: Segment = getMapValue(searchResults.itineraries.segments, segmentId);
        try {
            validateSegment(segment);
        } catch (err: any) {
            console.log('segmentId', segmentId);
            console.log('segment', segment);
            throw err;
        }
    });

}

// validate all passengers from search results
export function validatePassengers(searchResults: SearchResults): void {
    // validate passengers
    expect(keys(searchResults.passengers).length).toBeGreaterThan(0);

    keys(searchResults.passengers).forEach(paxId => {
        const passenger = getMapValue<Passenger>(searchResults.passengers, paxId);
        expect(passenger.type).not.toBeUndefined();
    });
}
