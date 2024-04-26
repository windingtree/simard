import { LoyaltyAccount } from "@simardwt/derbysoft-types";
import { PassengerType } from "@windingtree/glider-types/dist/accommodations";
import { PassengerAddress } from "../services/common/augmentations";

export type UatCreditCard = {
  cardNumber: string;
  cvv: string;
  country: string;
  paymentMethod: string;
  expiryMonth: string;
  expiryYear: string;
  billingAddress?: {
    countryCode?: string;
    stateProv?: string;
    postalCode?: string;
    cityName?: string;
    street?: string;
  };
};

type Passenger = {
  id: string;
  type: PassengerType;
  civility: string;
  gender: "Male" | "Female";
  lastnames: string[];
  firstnames: string[];
  birthdate: string;
  contactInformation: string[];
  address?: PassengerAddress;
};

export type TestType = "multiAvailability" | "booking" | "liveAvailability";

export type UatHotelData = {
  supplierId: string;
  hotelId: string;
  rooms: number;
  occupancy: {
    adult: number;
    child: number;
    childrenAges?: number[];
  };
  numberOfNights: number;
  dateOfArrival: Date;
  targetRate: "min" | "max" | "random" | "mid" | string;
  passengers: Passenger[];
  loyaltyAccount?: LoyaltyAccount;
  creditCard?: UatCreditCard;
  testType?: TestType;
  title?: string;
  doNotCancelAfter?: boolean;
  double?: boolean;
  disabled?: boolean;
  index?: number;
  specialRequest?: string;
};

export const marriottUatData: UatHotelData[] = [
  {
    supplierId: "MARRIOTT",
    hotelId: "ATLBD",
    rooms: 1,
    occupancy: {
      adult: 1,
      child: 0,
    },
    numberOfNights: 14,
    targetRate: "min",
    dateOfArrival: new Date("20-Jul-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Federer"],
        firstnames: ["Roger"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
  },
  {
    supplierId: "MARRIOTT",
    hotelId: "MIAAO",
    rooms: 2,
    occupancy: {
      adult: 1,
      child: 0,
    },
    numberOfNights: 7,
    targetRate: "min",
    dateOfArrival: new Date("31-Dec-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Federer"],
        firstnames: ["Roger"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
  },
  {
    supplierId: "MARRIOTT",
    hotelId: "MIAAO",
    rooms: 1,
    occupancy: {
      adult: 2,
      child: 0,
    },
    numberOfNights: 25,
    targetRate: "min",
    dateOfArrival: new Date("27-Jul-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Federer"],
        firstnames: ["Roger"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
      {
        id: "T2",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["James"],
        firstnames: ["Bond"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
  },
  {
    supplierId: "MARRIOTT",
    hotelId: "PHLAK",
    rooms: 2,
    occupancy: {
      adult: 1,
      child: 0,
    },
    numberOfNights: 21,
    targetRate: "min",
    dateOfArrival: new Date("1-Sep-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Federer"],
        firstnames: ["Roger"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
  },
  {
    supplierId: "MARRIOTT",
    hotelId: "PHLAK",
    rooms: 1,
    occupancy: {
      adult: 2,
      child: 0,
    },
    numberOfNights: 3,
    targetRate: "min",
    dateOfArrival: new Date("30-Dec-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Federer"],
        firstnames: ["Roger"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
      {
        id: "T2",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["James"],
        firstnames: ["Bond"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
  },
  {
    supplierId: "MARRIOTT",
    hotelId: "ATLBD",
    rooms: 1,
    occupancy: {
      adult: 5,
      child: 0,
    },
    numberOfNights: 1,
    targetRate: "min",
    dateOfArrival: new Date("21-Jul-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Federer"],
        firstnames: ["Roger"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
      {
        id: "T2",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["James"],
        firstnames: ["Bond"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
      {
        id: "T3",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["James"],
        firstnames: ["Franco"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
      {
        id: "T4",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Franco"],
        firstnames: ["Nero"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
      {
        id: "T5",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Nero"],
        firstnames: ["Jones"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
  },
  {
    supplierId: "MARRIOTT",
    hotelId: "ATLBD",
    rooms: 1,
    occupancy: {
      adult: 1,
      child: 0,
    },
    numberOfNights: 14,
    targetRate: "min",
    dateOfArrival: new Date("20-Jul-2023"),
    passengers: [
      {
        id: "T1",
        type: "ADT",
        civility: "MR",
        gender: "Male",
        lastnames: ["Constantino"],
        firstnames: ["Frank"],
        birthdate: "1980-03-21",
        contactInformation: ["+32123456789", "tom@simard.io"],
      },
    ],
    loyaltyAccount: {
      programCode: "MARRIOTT",
      accountId: "000121376",
    },
  },
];
