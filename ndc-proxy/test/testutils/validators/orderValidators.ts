import {CreateOrderRequest, CreateOrderResponse} from '../../../src/interfaces/glider';
import {PricedOffer} from '../../../src/interfaces/glider';
import {Segment} from '../../../src/interfaces/glider';
import {validateSegment} from './shoppingValidators';
import {getMapValue, keys} from './utils';

export function validateOrderCreateResponse(orderCreateResponse: CreateOrderResponse, orderCreateRequest: CreateOrderRequest, pricedOffer: PricedOffer): void {
    expect(orderCreateResponse.orderId.length).toBeGreaterThan(5);
    const order = orderCreateResponse.order;
    expect(order).not.toBeUndefined();
    expect(order.travelDocuments).not.toBeUndefined();
    // travel docs should be present
    expect(order.travelDocuments.bookings.length).toBeGreaterThan(0);
    expect(order.travelDocuments.etickets.length).toBeGreaterThan(0);

    // price should be present and same as in response from pricing
    expect(order.price.public).toBeGreaterThan(0);
    expect(order.price.currency.length).toEqual(3);
    expect(order.price.taxes).toBeGreaterThan(0);
    expect(order.price.commission).toBeGreaterThan(-1);

    // expect(order.price.public).toEqual(pricedOffer.price.public);    //uncomment this, TODO: compare total price with seats
    // expect(order.price.taxes).toEqual(pricedOffer.price.taxes);
    expect(order.price.commission).toEqual(pricedOffer.price.commission);
    expect(order.price.currency).toEqual(pricedOffer.price.currency);

    // passengers in order response should have same details as from request

    expect(order.passengers.length).toEqual(keys(orderCreateRequest.passengers).length);
// TODO add pax matching check
//     keys(orderCreateRequest.passengers).forEach(paxId=>{
//         const paxFromRequest = orderCreateRequest.passengers[paxId];
//
//
//     })

    // segments in order should match those in pricing response
    // expect(order.itinerary.segments.length).toEqual(keys(pricedOffer.itinerary.segments).length);
    keys(pricedOffer.itinerary.segments).forEach(segmentId => {
        const segmentFromPricing: Segment = getMapValue<Segment>(pricedOffer.itinerary.segments, segmentId);
        validateSegment(segmentFromPricing);
        const segmentFromOrder: Segment = order.itinerary.segments.find(segment => {
            return (
                segment.departureTime === segmentFromPricing.departureTime &&
                segment.arrivalTime === segmentFromPricing.arrivalTime &&
                segment.origin.iataCode === segmentFromPricing.origin.iataCode &&
                segment.origin.locationType === segmentFromPricing.origin.locationType &&
                segment.destination.iataCode === segmentFromPricing.destination.iataCode &&
                segment.destination.locationType === segmentFromPricing.destination.locationType &&
                segment.operator.flightNumber === segmentFromPricing.operator.flightNumber &&
                segment.operator.iataCode === segmentFromPricing.operator.iataCode &&
                segment.operator.operatorType === segmentFromPricing.operator.operatorType);
        });
        if (!segmentFromOrder) {
            console.log(`Cannot find segment from pricing in order, segment from pricing:`, segmentFromPricing);
            console.log(`Order segments`, order.itinerary.segments);
        }
        expect(segmentFromOrder).not.toBeUndefined();
    });
    // TODO add status check
    // TODO add options check
}
