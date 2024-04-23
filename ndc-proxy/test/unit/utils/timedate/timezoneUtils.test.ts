import {zonedTimeToUtc} from 'date-fns-tz';
import {convertDateToAirportTime, convertLocalAirportTimeToUtc} from '../../../../src/lib/timezones/timezoneUtils';
import {airports} from '../../../../src/lib/timezones/timeZoneByAirportCode';

describe('utils/timezoneUtils', () => {
  describe('#convertLocalAirportTimeToUtc', () => {
    it('should convert local airport time to UTC', () => {
      const yvrLocal = '2020-10-14T13:45:00';
      const yvrUtc = convertLocalAirportTimeToUtc(yvrLocal, 'YVR');
      expect(yvrUtc.toISOString()).toEqual('2020-10-14T20:45:00.000Z');
      console.log(`local YVR=>${yvrLocal}, UTC=>${yvrUtc.toISOString()}`);
      const nrtLocal = '2020-10-15T16:30:00';
      const nrtUtc = convertLocalAirportTimeToUtc(nrtLocal, 'NRT');
      console.log(`local NRT=>${nrtLocal}, UTC=>${nrtUtc.toISOString()}`);
      expect(nrtUtc.toISOString()).toEqual('2020-10-15T07:30:00.000Z');
    });

  });

  describe('#convertDateToAirportTime', () => {
    const date = '2020-09-14';
    const time = '14:30';
    const iataCode = 'YYZ';

    it('should to throw if wrong date has been passed', async () => {
      expect(() => convertDateToAirportTime(undefined, time, iataCode)).toThrowError();
      expect(() => convertDateToAirportTime('wrongString', time, iataCode)).toThrowError();
      expect(() => convertDateToAirportTime('', time, iataCode)).toThrowError();
    });

    it('should to throw if wrong time has been passed', async () => {
      expect(() => convertDateToAirportTime(date, undefined, iataCode)).toThrowError();
      expect(() => convertDateToAirportTime(date, 'wrongString', iataCode)).toThrowError();
      expect(() => convertDateToAirportTime(date, '', iataCode)).toThrowError();
    });

    it('should to throw if wrong iataCode has been passed', async () => {
      expect(() => convertDateToAirportTime(date, time, undefined)).toThrowError();
      expect(() => convertDateToAirportTime(date, time, '0000')).toThrowError();
      expect(() => convertDateToAirportTime(date, time, '')).toThrowError();
    });

    it('should covert date', async () => {
      const result = convertDateToAirportTime(date, time, iataCode);
      const airportTime = zonedTimeToUtc(
        `${date} ${time}:00.000`,
        airports[iataCode]
      ).toISOString();
      expect(result.toISOString()).toEqual(airportTime);
    });
  });

});
