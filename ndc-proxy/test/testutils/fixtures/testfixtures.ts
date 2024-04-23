/**
 * This module contains some example fixtures for elements that create offers search request payload.
 * They are meant to be used in tests.
 */
import {
  AccommodationSearchCriteria, FlightSearchCriteria,
  LocationCircle,
  LocationIATA, LocationInformation,
  LocationPoint,
  LocationRectangle,
  LocationType,
  PassengerSearchCriteria,
  PassengerType, SearchCriteria,
  SegmentCriteria
} from '../../../src/interfaces/glider';
import {createPassengerCriteria, createSegmentCriteria} from './searchCriteriaHelpers';

// locations
const locationFixtureDFW: LocationIATA = new LocationIATA('DFW', LocationType.airport);
const locationFixtureJFK: LocationIATA = new LocationIATA('JFK', LocationType.airport);
const locationFixtureLGA: LocationIATA = new LocationIATA('LGA', LocationType.airport);
const locationFixtureLHR: LocationIATA = new LocationIATA('LHR', LocationType.airport);
const locationRectangleFixture: LocationRectangle = new LocationRectangle({south: 55.13, west: 10.59, north: 69.06, east: 24.18});
const locationCircleFixture: LocationCircle = new LocationCircle({lat: 55.13, long: 10.59, radius: 10});
const locationPolygonFixture: LocationPoint[] = [
    new LocationPoint({lat: 24.8963928, long: 60.1749466}),
    new LocationPoint({lat: 24.9700356, long: 60.1763126}),
    new LocationPoint({lat: 24.9720097, long: 60.1475721})];

export const LocationFixtures = {
  locationFixtureDFW,
  locationFixtureJFK,
  locationFixtureLGA,
  locationFixtureLHR,
  locationRectangleFixture,
  locationCircleFixture,
  locationPolygonFixture,
};

// dates
const dateFixture20201001 = new Date('2020-10-01T13:10:04.687Z');
const dateFixture20201015 = new Date('2020-10-15T15:15:04.687Z');
const dateFixture20201020 = new Date('2021-10-20T10:20:04.687Z');

export const DateFixtures = {
  dateFixture20201001,
  dateFixture20201015,
  dateFixture20201020,
};

// segments
const segmentFixtureJFKDFW_20201001: SegmentCriteria = createSegmentCriteria('JFK', 'DFW', dateFixture20201001);
const segmentFixtureDFWJFK_20201015: SegmentCriteria = createSegmentCriteria('DFW', 'JFK', dateFixture20201015);
const segmentFixtureLGALHR_20201020: SegmentCriteria = createSegmentCriteria('LGA', 'LHR', dateFixture20201020);

export const SegmentFixtures = {
  segmentFixtureJFKDFW_20201001,
  segmentFixtureDFWJFK_20201015,
  segmentFixtureLGALHR_20201020,
};

// passengers
const passengerCriteriaFixture1ADT: PassengerSearchCriteria = createPassengerCriteria(PassengerType.ADT, 1);
const passengerCriteriaFixture2ADT: PassengerSearchCriteria = createPassengerCriteria(PassengerType.ADT, 2);
const passengerCriteriaFixture1CHD: PassengerSearchCriteria = createPassengerCriteria(PassengerType.CHD, 1);
const passengerCriteriaFixture1INF: PassengerSearchCriteria = createPassengerCriteria(PassengerType.INF, 1);

export const PassengerFixtures = {
  passengerCriteriaFixture1ADT,
  passengerCriteriaFixture2ADT,
  passengerCriteriaFixture1CHD,
  passengerCriteriaFixture1INF,
};

// itineraries
const itineraryFixtureJFKDFW_Return: FlightSearchCriteria = new FlightSearchCriteria([segmentFixtureJFKDFW_20201001, segmentFixtureDFWJFK_20201015]);
const itineraryFixtureJFKDFW_OneWay: FlightSearchCriteria = new FlightSearchCriteria([segmentFixtureJFKDFW_20201001]);

export const ItineraryFixtures = {
  itineraryFixtureJFKDFW_Return,
  itineraryFixtureJFKDFW_OneWay,
};

// accommodations
const accommodationRectangleFixture: AccommodationSearchCriteria = new AccommodationSearchCriteria({
  location: LocationInformation.createRectangleLocationInstance(locationRectangleFixture),
  arrival: dateFixture20201015,
  departure: dateFixture20201020,
});
const accommodationCircleFixture: AccommodationSearchCriteria = new AccommodationSearchCriteria({
  location: LocationInformation.createCircleLocationInstance(locationCircleFixture),
  arrival: dateFixture20201015,
  departure: dateFixture20201020,
});
const accommodationPolygonFixture: AccommodationSearchCriteria = new AccommodationSearchCriteria({
  location: LocationInformation.createPolygonLocationInstance(locationPolygonFixture),
  arrival: dateFixture20201015,
  departure: dateFixture20201020,
});

export const AccommodationFixtures = {
  accommodationRectangleFixture,
  accommodationCircleFixture,
  accommodationPolygonFixture,
};

const flightSearchFixtureJFKDFW_OneWay_1ADT: SearchCriteria = SearchCriteria.createFlightSearchCriteriaInstance(itineraryFixtureJFKDFW_OneWay, [passengerCriteriaFixture1ADT]);
const flightSearchFixtureJFKDFW_Return_2ADT_1INF: SearchCriteria = SearchCriteria.createFlightSearchCriteriaInstance(itineraryFixtureJFKDFW_Return, [passengerCriteriaFixture2ADT, passengerCriteriaFixture1INF]);
const hotelSearchFixtureRectangle_1ADT: SearchCriteria = SearchCriteria.createAccommodationSearchCriteriaInstance(accommodationRectangleFixture, [passengerCriteriaFixture1ADT]);
const hotelSearchFixtureCircle_2ADT: SearchCriteria = SearchCriteria.createAccommodationSearchCriteriaInstance(accommodationCircleFixture, [passengerCriteriaFixture2ADT]);
const hotelSearchFixturePolygon_2ADT: SearchCriteria = SearchCriteria.createAccommodationSearchCriteriaInstance(accommodationPolygonFixture, [passengerCriteriaFixture2ADT]);

export const SearchCriteriaFixtures = {
  flightSearchFixtureJFKDFW_OneWay_1ADT,
  flightSearchFixtureJFKDFW_Return_2ADT_1INF,
  hotelSearchFixtureRectangle_1ADT,
  hotelSearchFixtureCircle_2ADT,
  hotelSearchFixturePolygon_2ADT,
};
