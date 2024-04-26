/* eslint-disable no-console */
import { UatHotelData } from "../uat-data";
import { Avail, avail, liveAvail } from "./avail";
import { Booking, booking } from "./booking";
import { faker } from "@faker-js/faker";
import { negCellCodes } from "./neg-cell-codes";

type TestType = UatHotelData["testType"];
type Passenger = UatHotelData["passengers"][0];

type Test = {
  testType: TestType;
  data: Avail[];
  title: string;
};

export const buildPremierInnUatData = (): UatHotelData[] => {
  console.log("Building Premier Inn UAT data");
  const tests: Test[] = [
    {
      testType: "multiAvailability",
      data: avail,
      title: "avail-Cache",
    },
    {
      testType: "liveAvailability",
      data: liveAvail,
      title: "avail-Live",
    },
    {
      testType: "booking",
      data: booking,
      title: "booking",
    },
    {
      testType: "booking",
      data: negCellCodes,
      title: "negCellCodes",
    },
  ];

  const premierInnUatData: UatHotelData[] = [];

  for (let idx = 0; idx < tests.length; idx++) {
    const { data, title, testType } = tests[idx];
    const extractedData = data.map((avail) =>
      extractUatHotelData(avail as Booking, testType, title)
    );

    premierInnUatData.push(...extractedData);
  }

  console.log("Building complete!");
  return premierInnUatData;
};

const extractUatHotelData = (avail: Booking, testType: TestType, title: string): UatHotelData => {
  let childrenAges: number[];
  if (avail.Children) {
    childrenAges = [];
    for (let i = 0; i < avail.Children; i++) {
      childrenAges.push(Math.ceil(Math.random() * 4) + 3);
    }
  }

  const contactPersonSex = faker.person.sexType();
  const contactPerson: Passenger = {
    birthdate: faker.date.birthdate().toDateString(),
    civility: avail.GuestTitle ?? faker.person.prefix(contactPersonSex),
    contactInformation: [
      avail.Telephone ?? faker.phone.number("#### ### ####"),
      avail.EmailAddress ?? faker.internet.email(),
    ],
    firstnames: [avail.GuestInitial ?? faker.person.firstName()],
    lastnames: [avail.GuestSurname ?? faker.person.lastName()],
    address: {
      addressLine1: avail.Address1,
      postalCode: avail.PostCode,
    },
    gender: contactPersonSex === "female" ? "Female" : "Male",
    id: "0",
    type: "ADT",
  };

  const occupancy = {
    adult: avail.Adults,
    child: avail.Children,
    childrenAges,
    contactPerson,
  };

  const passengers = buildPassengers(occupancy);

  const monthMap = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };

  let expiryMonth: string, expiryYear: string;
  if (avail.ExpiryDate) {
    const expiryMonthShort = avail.ExpiryDate?.split("-")[0]?.toUpperCase();
    expiryMonth = expiryMonthShort && monthMap[expiryMonthShort];
    const expiryYearShort = avail.ExpiryDate?.split("-")[1];
    expiryYear = expiryYearShort.length === 2 ? "20" + expiryYearShort : expiryYearShort;
  }

  return {
    dateOfArrival: avail.Arrival,
    hotelId: avail.Property,
    numberOfNights: avail.Nights,
    occupancy,
    rooms: avail.Rooms,
    supplierId: "PREMIERINN",
    creditCard: {
      cardNumber: avail.CreditCard?.replace(/\s+/g, ""),
      expiryMonth,
      expiryYear,
      cvv: "123",
      country: "US",
      paymentMethod: convertCardCodeToPciProxyCode(avail.CardType),
    },
    testType,
    title,
    passengers,
    targetRate: avail.CellCode,
    doNotCancelAfter: avail.doNotCancelAfter,
    double: avail.Double === "Yes",
    disabled: avail.Disabled === "Yes",
    index: parseInt(avail.Test || "0") ?? undefined,
    specialRequest: avail.SpecialRequirementsText,
  };
};

const convertCardCodeToPciProxyCode = (cardCode: string) => {
  if (!cardCode) return undefined;
  switch (cardCode) {
    case "AX":
    case "AM":
      return "AMX";
    case "DN":
      return "DIN";
    case "JC":
      return "JCB";
    case "MC":
      return "ECA";
    case "VI":
      return "VIS";
    default:
      throw new Error(`Invalid card brand provided: ${cardCode}`);
  }
};

const buildPassengers = ({
  adult,
  child,
  childrenAges,
  contactPerson,
}: {
  adult: number;
  child: number;
  childrenAges?: number[];
  contactPerson: Passenger;
}) => {
  const passengers: Passenger[] = [];

  // contact person is the first passenger
  passengers.push(contactPerson);

  // build other adult passengers
  if (adult > 1) {
    const sex = faker.person.sexType();
    for (let i = 1; i < adult; i++) {
      const passenger: Passenger = {
        birthdate: faker.date.birthdate().toDateString(),
        civility: faker.person.prefix(sex),
        contactInformation: [faker.phone.number("#### ### ####"), faker.internet.email()],
        firstnames: [faker.person.firstName()],
        lastnames: [faker.person.lastName()],
        gender: sex === "female" ? "Female" : "Male",
        address: contactPerson.address,
        id: i.toString(),
        type: "ADT",
      };

      passengers.push(passenger);
    }
  }

  // build child passengers
  const childSex = faker.person.sexType();
  for (let i = 0; i < child; i++) {
    const passenger: Passenger = {
      birthdate: getBirthdate(childrenAges[i]).toISOString(),
      civility: faker.person.prefix(childSex),
      contactInformation: [faker.phone.number("#### ### ####"), faker.internet.email()],
      firstnames: [faker.person.firstName()],
      lastnames: [faker.person.lastName()],
      gender: childSex === "female" ? "Female" : "Male",
      address: contactPerson.address,
      id: i.toString(),
      type: "ADT",
    };

    passengers.push(passenger);
  }

  return passengers;
};

const getBirthdate = (ageInYears: number) => {
  const ageInMillis = ageInYears * 365 * 24 * 60 * 60;
  const dateOfBirth = new Date(new Date().getTime() - ageInMillis);

  return dateOfBirth;
};
