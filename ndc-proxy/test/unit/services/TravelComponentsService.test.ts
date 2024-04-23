import {TravelComponentsService} from '../../../src/services/orders/TravelComponentsService';
import {
    ExtendedPriceDetails,
    ItinerarySummary,
    LocationIATA,
    Order, Passenger,
    Segment,
    TravelDocuments,
    TravelOperator
} from '../../../src/interfaces/glider';
import moment from 'moment';

const operatingFlightAA123 = new  TravelOperator();
operatingFlightAA123.flightNumber = '123';
operatingFlightAA123.iataCode = 'AA';

const marketingFlightB655 = new  TravelOperator();
marketingFlightB655.flightNumber = '55';
marketingFlightB655.iataCodeM = 'B6';

// invalid case when flight number contains carrier code (today in prod, to be fixed)
const operatingFlightAA123withCarrierCode = new  TravelOperator();
operatingFlightAA123withCarrierCode.flightNumber = 'AA0123';
operatingFlightAA123withCarrierCode.iataCode = 'AA';

const airportJFK = new LocationIATA('JFK');
const airportDFW = new LocationIATA('DFW');

const date20220125 = moment('2022-01-25T00:00:00.00Z').toDate();
const date20220215 = moment('2022-02-15T00:00:00.00Z').toDate();

const marketingFlightSegment = new Segment();
marketingFlightSegment.origin = airportDFW;
marketingFlightSegment.destination = airportJFK;
marketingFlightSegment.operator = marketingFlightB655;
marketingFlightSegment.departureTime = date20220125;
marketingFlightSegment.arrivalTime = date20220215;

const operatingFlightSegment = new Segment();
operatingFlightSegment.origin = airportDFW;
operatingFlightSegment.destination = airportJFK;
operatingFlightSegment.operator = operatingFlightAA123;
operatingFlightSegment.departureTime = date20220125;
operatingFlightSegment.arrivalTime = date20220215;

const passenger: Passenger = new Passenger();
passenger.firstnames = ['John'];
passenger.lastnames = ['Doe'];
passenger.contactInformation = ['+12312312312', 'john@doe.com'];

describe('TravelComponentsService', () => {

    test('#convertSegment should convert segment to format required by Simard Pay - operating flight', () => {
        const result = TravelComponentsService.convertSegment(operatingFlightSegment);
        expect(result.origin).toBe('DFW');
        expect(result.destination).toBe('JFK');
        expect(result.iataCode).toBe('AA');
        expect(result.flightNumber).toBe('0123');
        expect(result.departureTime).toBe('2022-01-25T00:00:00.000Z');
        expect(result.arrivalTime).toBe('2022-02-15T00:00:00.000Z');
    });

    test('#convertSegment should convert segment to format required by Simard Pay - marketing flight', () => {
        const result = TravelComponentsService.convertSegment(marketingFlightSegment);
        expect(result.origin).toBe('DFW');
        expect(result.destination).toBe('JFK');
        expect(result.iataCode).toBe('B6');
        expect(result.flightNumber).toBe('0055');
        expect(result.departureTime).toBe('2022-01-25T00:00:00.000Z');
        expect(result.arrivalTime).toBe('2022-02-15T00:00:00.000Z');
        expect(result.serviceClass).not.toBe(undefined);
    });

    test('#convertSegment should convert segment to format required by Simard Pay (in case flightNumber contains carrier code too)', () => {
        const segment = new Segment();
        segment.origin = airportDFW;
        segment.destination = airportJFK;
        segment.operator = operatingFlightAA123withCarrierCode;
        segment.departureTime = date20220125;
        segment.arrivalTime = date20220215;

        const result = TravelComponentsService.convertSegment(segment);
        expect(result.origin).toBe('DFW');
        expect(result.destination).toBe('JFK');
        expect(result.iataCode).toBe('AA');
        expect(result.flightNumber).toBe('0123');
        expect(result.departureTime).toBe('2022-01-25T00:00:00.000Z');
        expect(result.arrivalTime).toBe('2022-02-15T00:00:00.000Z');
        expect(result.serviceClass).not.toBe(undefined);
    });

    test('#convertSegment should convert segment to format required by Simard Pay - marketing flight', () => {
        const order: Order = new Order();
        order.travelDocuments = new TravelDocuments(['12345678901234'], ['ABCDEF']);
        order.itinerary = new ItinerarySummary([operatingFlightSegment]);
        order.price = new ExtendedPriceDetails(3694.49, 'USD', 0, 301.66);
        order.passengers = [passenger];
        const result = TravelComponentsService.convertOrder(order);
        expect(result.documentIssuanceDate).toBe(moment().format('YYYY-MM-DD'));
        expect(result.segments.length).toEqual(1);
        expect(result.recordLocator).toBe('ABCDEF');
        expect(result.documentNumber).toBe('12345678901234');
        expect(result.documentType).toBe('TKT');
        expect(result.componentType).toBe('air');
        expect(result.amounts.total).toBe('3694.49');
        expect(result.amounts.base).toBe('3392.83');
        expect(result.contactEmail).toStrictEqual('john@doe.com');
    });

});
