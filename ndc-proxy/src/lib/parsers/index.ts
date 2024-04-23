// const parse = require('date-fns/parse');
import {convertLocalAirportTimeToUtc} from '../timezones/timezoneUtils';

export const reduceObjectToProperty = (array, property) => Object.entries(array)
  .reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: value[property],
    }),
    {}
  );

export const splitPropertyBySpace = (array, property) => array
  .map(
    (element) => ({
      ...element,
      [property]: element[property].split(' '),
    })
  );

export const reduceContactInformation = (passengers) => passengers
  .map(
    (passenger) => {
      const emails = passenger.contactInformation && Array.isArray(passenger.contactInformation.emails)
        ? passenger.contactInformation.emails.map(({ value }) => value)
        : [];
      const phones = passenger.contactInformation && Array.isArray(passenger.contactInformation.phones)
        ? passenger.contactInformation.phones.map(({ value }) => value)
        : [];
      return {
        ...passenger,
        contactInformation: emails.concat(phones),
      };
    }
  );

export const useDictionary = (array, object, keyToReplace) => array
  .map(
    (element) => ({
      ...element,
      [keyToReplace]: object[element[keyToReplace]],
    })
  );

export const mergeHourAndDate = array => array
  .map(
    ({
      splittedDepartureDate,
      splittedDepartureTime,
      splittedArrivalDate,
      splittedArrivalTime,
      origin,
      destination,
      ...others}) => ({
      ...others,
      origin,
      destination,
      departureTime: convertLocalAirportTimeToUtc(
        `${splittedDepartureDate} ${splittedDepartureTime}:00.000`,
        origin.iataCode
      ).toISOString(),
      arrivalTime: convertLocalAirportTimeToUtc(
        `${splittedArrivalDate} ${splittedArrivalTime}:00.000`,
        destination.iataCode
      ).toISOString(),
    })
  );

export const reduceToProperty = (object, property) => Object.keys(object)
  .map((key) => {
    return {
      [key]: object[key][property],
    };
  });

/* istanbul ignore next */
export const splitSegments = (combinations) => combinations
  .map(
    ({ _items_, ...others }) => ({
      ...others,
      _items_: _items_.split(' '),
    })
  );

/**
 * Convert an array of objects (each having '_id_' property), into associative array which key is '_id_' and value is object that had '_id_' property.
 * Example:
 * input: [{_id_:'Key1',name:'Object1'},{_id_:'Key2',name:'Object2'}]
 * output: {'Key1':{name:'Object1'},'Key2':{name:'Object2'}}
 *
 * @param array
 * @return {*}
 */
export const reduceToObjectByKey = (array) => array
  .reduce(
    (segments, { _id_, ...others }) => ({
      ...segments,
      [_id_]: others,
    }),
    {}
  );

export const roundCommissionDecimals = (offers) => offers
  .map(
    ({ price, ...others }) => ({
      ...others,
      price: {
        ...price,
        commission: price.commission.toFixed(2).toString(),
      },
    })
  );

export const reduceAccommodation = (accommodation) => accommodation
  .reduce(
    (ac, { _provider_, _id_, ...others }) => {
      const key = `${_provider_}.${_id_}`;
      return {
        ...ac,
        [key]: others,
      };
    },
    {}
  );

/* istanbul ignore next */
export const reduceRoomStays = (_roomStays_ => {
  // The offer dicts will contain all offers
  const offers = {};
  _roomStays_.forEach(roomStay => {

    // Create the accommodation key
    const accommodationReference = `${roomStay._provider_}.${roomStay._hotelCode_}`;

    // Build the offers by parsing the room rates
    roomStay._roomRates_.forEach(roomRate => {

      // Build the offer key
      const offerKey = `${accommodationReference}.${roomRate.ratePlanReference}.${roomRate.roomTypeReference}`;

      // Build the PricePlanReference
      const pricePlanReference = {
        accommodation: accommodationReference,
        roomType: roomRate.roomTypeReference,
      };
      const pricePlansReferences = {};
      pricePlansReferences[roomRate.ratePlanReference] = pricePlanReference;

      // Add the offer item to the offers dict
      offers[offerKey] = {
          // Reference from other elements
          pricePlansReferences,

          // Build price
          price: {
              currency: roomRate.price.currency,
              public: roomRate.price._afterTax_,
              taxes: Number(roomRate.price._afterTax_) - Number(roomRate.price._beforeTax_),
          },
      };
    });
  });
  return offers;
});

// Deep merge of two objects
export const deepMerge = (target, source) => {

  for (const key of Object.keys(source)) {

    if (source[key].constructor === Object && target[key]) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    } else {
      target[key] = source[key];
    }
  }

  return Object.assign(target || {}, source);
};
