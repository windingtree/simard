import { StayRange } from "@simardwt/derbysoft-types";
import { DateTime } from "luxon";
import { HotelOTAError } from "../../types";
import { toStayRange } from "./stayRange";

describe("test stayRange operations", () => {
  describe("toStayRange is working properly", () => {
    const pastArrival = DateTime.now().minus({ days: 1 }).toISO();
    const today = DateTime.now().plus({ days: 3 }).toISO();
    const futureArrival = DateTime.now().plus({ days: 3 }).toISO();
    const futureDeparture = DateTime.now().plus({ days: 5 }).toISO();
    const testTable: [string, string, string, StayRange | any][] = [
      [
        futureArrival,
        futureDeparture,
        "",
        {
          checkin: DateTime.fromISO(futureArrival).toISODate(),
          checkout: DateTime.fromISO(futureDeparture).toISODate(),
        },
      ],
      [pastArrival, futureDeparture, "Arrival date is in the past", {}],
      [futureArrival, pastArrival, "Departure date is prior to arrival date", {}],
      [
        futureArrival,
        futureArrival,
        "",
        {
          checkin: DateTime.fromISO(futureArrival).toISODate(),
          checkout: DateTime.fromISO(futureArrival).toISODate(),
        },
      ],
      [
        today,
        today,
        "",
        {
          checkin: DateTime.fromISO(today).toISODate(),
          checkout: DateTime.fromISO(today).toISODate(),
        },
      ],
      ["undef", futureDeparture, "Invalid arrival date", {}],
      [futureDeparture, "undef", "Invalid departure date", {}],
    ];

    it.each(testTable)(
      "test %#",
      (arrival: string, departure: string, exception: string, expected: StayRange) => {
        if (exception) {
          expect(() => toStayRange(arrival, departure)).toThrow(new HotelOTAError(exception));
        } else {
          expect(toStayRange(arrival, departure)).toEqual(expected);
        }
      }
    );
  });
});
