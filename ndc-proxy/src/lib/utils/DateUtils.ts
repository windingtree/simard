import moment from 'moment-timezone';
import {airports} from '../timezones/timeZoneByAirportCode';
import {LoggerFactory} from '../logger';
const logger = LoggerFactory.createLogger(__filename);
export enum DateFormat {
    YYYY_MM_DD= 'YYYY-MM-DD',
}

function getTimezoneForAirport(airportCode: string): string {
    const airportCodeUpper = (airportCode || '').toUpperCase();
    const timezone = airports[airportCodeUpper];
    if (!timezone) {
        logger.warning(`Cannot find timezone code for airport ${airportCode}! Not possible to convert departure time to correct timezone`);
        throw new Error(`Missing timezone information for ${airportCode}`);
    }
    return timezone;
}

export function convertToDateString(date: Date, format: DateFormat): string {
    return moment(date).format(format);
}

export function convertToDateStringWithTimezone(date: Date, airportCode: string, format: DateFormat): string {
    // console.log(`segment.departureTime from client2:${date}, airport:${airportCode}`);
    // console.log(`moment.tz=${moment(date).format(format)}`);
    // console.log(`moment.tz=${moment(date).tz(getTimezoneForAirport(airportCode)).format(format)}`);
    return moment(date).tz(getTimezoneForAirport(airportCode)).format(format);
    // return moment(date).format(format);
}
