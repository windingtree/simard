import {NDCFlightInfo, NDCFlightSegment, NDCPassenger, NDCStationLocation} from '../../interfaces/ndc';
import {convertDateToAirportTime} from '../timezones/timezoneUtils';
import {
    LocationIATA,
    LocationType,
    Passenger,
    PassengerType,
    Segment,
    TravelOperator,
} from '../../interfaces/glider';
import {TravelOperatorType} from '../../interfaces/glider/air/TravelOperatorType';

export function convertPassengerType(ndcPassengerType: string): PassengerType {
    switch (ndcPassengerType) {
        case 'ADT':
        case 'SRC':
            return PassengerType.ADT;
        case 'CNN':
        case 'C11':
        case 'C15':
        case 'YTH':
            return PassengerType.CHD;
        case 'INF':
        case 'INS':
            return PassengerType.INF;
        default:
            throw new Error(`Unknown NDC passenger type:${ndcPassengerType}`);
    }
}

export function convertToGliderPassenger(ndcPax: NDCPassenger): Passenger {
    const gliderPax = new Passenger();
    gliderPax.id = ndcPax.PassengerID;
    gliderPax.type = convertPassengerType(ndcPax.type);
    if (ndcPax.GivenName) {
        gliderPax.firstnames = [ndcPax.GivenName];
    }
    if (ndcPax.Surname) {
        gliderPax.lastnames = [ndcPax.Surname];
    }
    if (ndcPax.Middlename) {
        gliderPax.middlenames = [ndcPax.Middlename];
    }
    return gliderPax;
}

export function convertToGliderSegment(ndcSegment: NDCFlightSegment): Segment {
    const seg = new Segment();
    const {Arrival, Departure, Equipment} = ndcSegment;
    seg.departureTime = convertDateToAirportTime(Departure.Date, Departure.Time, Departure.AirportCode);
    seg.origin = convertToGliderLocation(Departure);

    seg.arrivalTime = convertDateToAirportTime(Arrival.Date, Arrival.Time, Arrival.AirportCode);
    seg.destination = convertToGliderLocation(Arrival);

    seg.operator = convertToGliderTravelOperator(ndcSegment.OperatingCarrier, ndcSegment.MarketingCarrier);
    seg.equipment = { aircraftCode: Equipment.AircraftCode, name: Equipment.Name };

    return seg;
}

export function convertToGliderLocation(ndcStation: NDCStationLocation): LocationIATA {
    const location = new LocationIATA();
    location.locationType = convertToGliderLocationType(ndcStation.locationType);
    location.iataCode = ndcStation.AirportCode;
    return location;
}

// TODO - handle other cases
export function convertToGliderLocationType(ndcLocationType: string): LocationType {
    return LocationType.airport;
}

export function convertToGliderTravelOperator(operatingCarrier: NDCFlightInfo, marketingCarrier: NDCFlightInfo): TravelOperator {
    const to = new TravelOperator();
    to.operatorType = TravelOperatorType.airline;
    to.flightNumber = `${marketingCarrier.AirlineID}${marketingCarrier.FlightNumber}`;
    if (operatingCarrier && operatingCarrier.AirlineID && operatingCarrier.AirlineID.length > 0) {
        // if operating carrier is defined, it's codeshare
        to.iataCode = operatingCarrier.AirlineID;
        to.iataCodeM = marketingCarrier.AirlineID;
    } else {
        to.iataCode = marketingCarrier.AirlineID;
        // to.iataCodeM = marketingCarrier.AirlineID;
    }
    // console.log('Flight:', to.flightNumber, ', Operating carrier:', operatingCarrier, ', Marketing:', marketingCarrier);
    return to;
}
