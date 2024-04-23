
// validate single offer from search results
import {PricedOffer} from '../../../src/interfaces/glider';
import {Offer, Passenger, SearchResults, Segment} from '../../../src/interfaces/glider';
import moment from 'moment';
import {validateSegment} from './shoppingValidators';
import {getMapValue, keys} from './utils';

export function validatePricedOffer(pricedOffer: PricedOffer, searchResults: SearchResults, offerIdFromSearch: string): void {
    // expiration date should be in he future
    expect(moment(pricedOffer.expiration).isSameOrAfter(moment())).toBeTruthy();
    // but not later than 1 day from now
    expect(moment(pricedOffer.expiration).isSameOrBefore(moment().add(1, 'days'))).toBeTruthy();

    expect(pricedOffer.price.public).toBeGreaterThan(0);
    expect(pricedOffer.price.public).toBeLessThan(10000);
    expect(pricedOffer.price.currency).toHaveLength(3);
    expect(pricedOffer.price.taxes).toBeGreaterThan(0);

    // expect(keys(pricedOffer.disclosures).length).toBeGreaterThan(0);  //TODO - uncomment this
    // expect(keys(pricedOffer.terms).length).toBeGreaterThan(0); //TODO - uncomment this

    const searchOffer: Offer = getMapValue<Offer>(searchResults.offers, offerIdFromSearch);
    // compare prices with pricedOffer from search results
    expect(pricedOffer.price.public - searchOffer.price.public).toBeLessThan(200);
    expect(pricedOffer.price.taxes - searchOffer.price.taxes).toBeLessThan(100);
    expect(pricedOffer.price.currency).toEqual(searchOffer.price.currency);

    expect(keys(pricedOffer.passengers).length).toBeGreaterThan(0);

    const passengersFromSearch = searchResults.passengers;
    // make sure passengers from search results are same as in priced pricedOffer
    keys(passengersFromSearch).forEach(paxId => {
        const paxFromSearch = getMapValue<Passenger>(passengersFromSearch, paxId);
        const paxFromPricing = getMapValue<Passenger>(pricedOffer.passengers, paxId);

        expect(paxFromSearch).not.toBeUndefined();
        expect(paxFromPricing).not.toBeUndefined();

        expect(paxFromSearch.type).toEqual(paxFromPricing.type);
    });

    const segmentsFromSearch = searchResults.itineraries.segments;
    expect(keys(pricedOffer.itinerary.segments).length).toBeGreaterThan(0);
    // make sure segments from search results are same in priced pricedOffer
    keys(pricedOffer.itinerary.segments).forEach(segmentId => {
        const segmentFromPricing: Segment = getMapValue<Segment>(pricedOffer.itinerary.segments, segmentId);
        expect(segmentFromPricing).not.toBeUndefined();
        validateSegment(segmentFromPricing);
        const segmentFromSearch: Segment = getMapValue<Segment>(segmentsFromSearch, segmentId);
        expect(segmentFromSearch).not.toBeUndefined();
        expect(segmentFromPricing.departureTime).toEqual(segmentFromSearch.departureTime);
        expect(segmentFromPricing.arrivalTime).toEqual(segmentFromSearch.arrivalTime);
        expect(segmentFromPricing.origin).toEqual(segmentFromSearch.origin);
        expect(segmentFromPricing.destination).toEqual(segmentFromSearch.destination);
        expect(segmentFromPricing.operator).toEqual(segmentFromSearch.operator);
    });

    // validate priced items
    expect(pricedOffer.pricedItems.length).toBeGreaterThan(0);
    pricedOffer.pricedItems.forEach(pricedItem => {
        expect(pricedItem.taxes.length).toBeGreaterThan(0);
        // iterate over taxes and check if they all have mandatory elements
        pricedItem.taxes.forEach(tax => {
            expect(tax.amount).toBeGreaterThan(0);
            expect(tax.currency).toHaveLength(3);
            expect(tax.code).not.toBeUndefined();
            expect(tax.description).not.toBeUndefined();
        });
        // TODO - uncomment this
        /*
                expect(pricedItem.fare.length).toBeGreaterThan(0);
                pricedItem.fare.forEach(fare => {
                    expect(fare.amount).toBeGreaterThan(0);
                    expect(fare.usage).not.toBeUndefined();
                    expect(fare.components.length).toBeGreaterThan(0);
                });
        */

    });

}
