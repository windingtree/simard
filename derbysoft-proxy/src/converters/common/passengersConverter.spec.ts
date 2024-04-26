import { RoomCriteria } from "@simardwt/derbysoft-types";
import { PassengerSearch } from "@windingtree/glider-types/dist/accommodations";
import { HotelOTAError } from "../../types";
import { toRoomCriteria } from "./passengersConverter";

describe("passenger converters functions are working properly ", () => {
  describe("PassengersToRoomCriteria is working properly", () => {
    const testTable: [PassengerSearch[], number, string, RoomCriteria | any][] = [
      [
        [
          {
            type: "ADT",
            count: 2,
          },
        ],
        1,
        "",
        {
          adultCount: 2,
          roomCount: 1,
          childAges: [],
          childCount: 0,
        },
      ],
      [
        [
          {
            type: "INF",
            count: 2,
            childrenAges: [1, 2],
          },
          {
            type: "INF",
            count: 3,
            childrenAges: [3, 4, 5],
          },
        ],
        3,
        "",
        {
          adultCount: 0,
          roomCount: 3,
          childAges: [1, 2, 3, 4, 5],
          childCount: 5,
        },
      ],
      [
        [
          {
            type: "ADT",
            count: 2,
          },
          {
            type: "INF",
            count: 2,
            childrenAges: [1, 2],
          },
          {
            type: "CHD",
            count: 2,
            childrenAges: [3, 4],
          },
        ],
        1,
        "",
        {
          adultCount: 2,
          roomCount: 1,
          childAges: [1, 2, 3, 4],
          childCount: 4,
        },
      ],
      [
        [
          {
            type: "ADT",
            count: 2,
          },
          {
            type: "INF",
            count: 3,
          },
        ],
        1,
        "'INF' passenger type must have childrenAges array",
        "",
      ],
      [
        [
          {
            type: "ADT",
            count: 2,
          },
          {
            type: "INF",
            count: 3,
            childrenAges: [2, 4],
          },
        ],
        1,
        "'INF' childrenAges array elements is not equal to the children count",
        "",
      ],
    ];

    it.each(testTable)(
      "test %#",
      (
        passengers: PassengerSearch[],
        roomCount: number,
        exception: string,
        expected: RoomCriteria | any
      ) => {
        if (exception) {
          expect(() => toRoomCriteria(passengers, roomCount)).toThrow(new HotelOTAError(exception));
        } else {
          expect(toRoomCriteria(passengers, roomCount)).toEqual(expected);
        }
      }
    );
  });
});
