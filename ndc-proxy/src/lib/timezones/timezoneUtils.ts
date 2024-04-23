import { zonedTimeToUtc } from 'date-fns-tz';
import { airports } from './timeZoneByAirportCode';
import {isMatch } from 'date-fns';

export function convertLocalAirportTimeToUtc(localDateTime: string, iataCode: string): Date {
  return zonedTimeToUtc(localDateTime, airports[iataCode]);
}

export function convertDateToAirportTime(date: string, time: string, iataCode: string): Date {
  const datetime = `${date} ${time}`;
  if (!isMatch(datetime, 'yyyy-MM-dd HH:mm')) {
    throw new Error(`Incorrect date format, date ${date}, time ${time}`);
  }

  if (!iataCode) {
    throw new Error('Missing airport code');
  }

  if (!airports[iataCode]) {
    throw new Error(`Timezone for airport ${iataCode} not found`);
  }

  return zonedTimeToUtc(
      `${datetime}:00.000`,
      airports[iataCode]
  );
}
