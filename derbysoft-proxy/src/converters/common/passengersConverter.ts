import { Guest, GuestType, RoomCriteria } from "@simardwt/derbysoft-types";
import { ContactPerson } from "@simardwt/derbysoft-types/dist/common/ContactPerson";
import { GenderType } from "@simardwt/derbysoft-types/dist/enums/GenderType";
import {
  PassengerBooking,
  PassengerSearch,
  PassengerType,
} from "@windingtree/glider-types/dist/accommodations";
import { HotelOTAError } from "../../types";

export const WTPassengerToDerbySoftGuest = (passenger: PassengerBooking, index?: number): Guest => {
  const guest = new Guest();
  guest.firstName = concatNames(passenger.firstnames);
  guest.lastName = concatNames(passenger.lastnames);
  guest.email = extractFirstEmail(passenger.contactInformation);
  guest.phone = extractFirstPhone(passenger.contactInformation);
  guest.type = WTPassengerTypeToDerbysoftGuestType(passenger.type);
  guest.birthday = passenger.birthdate;
  if (passenger.gender === "Female") {
    guest.gender = GenderType.Female;
  } else if (passenger.gender === "Male") {
    guest.gender = GenderType.Male;
  }
  guest.index = index;
  return guest;
};

// from amadeus-proxy
const concatNames = (names: string[]) => {
  if (Array.isArray(names)) {
    return names.join(" ");
  } else return "";
};

// from amadeus-proxy
const extractFirstEmail = (nameOrEmail?: string[]): string | undefined => {
  let emails = [];
  if (Array.isArray(nameOrEmail)) {
    emails = nameOrEmail.filter((item) => item.indexOf("@") > -1);
  }
  return emails.length > 0 ? emails[0] : undefined;
};

// from amadeus-proxy
const extractFirstPhone = (nameOrEmail?: string[]): string | undefined => {
  let phones = [];
  if (Array.isArray(nameOrEmail)) {
    phones = nameOrEmail.filter((item) => item.indexOf("@") == -1);
  }
  return phones.length > 0 ? phones[0] : undefined;
};

export const guestToContactPerson = (guest: Guest): ContactPerson => {
  const contactPerson = new ContactPerson(guest.firstName, guest.lastName);
  contactPerson.address = guest.address;
  contactPerson.email = guest.email;
  contactPerson.phone = guest.phone;
  return contactPerson;
};

export const WTPassengerTypeToDerbysoftGuestType = (passengerType: PassengerType): GuestType => {
  switch (passengerType) {
    case "ADT":
      return GuestType.Adult;
    case "CHD":
      return GuestType.Child;
    case "INF":
      return GuestType.Infant;
    default:
      throw new HotelOTAError(`Invalid Passenger Type Code: ${passengerType}`);
  }
};

export const DerbySoftGuestToWTPassenger = (guest: Guest): PassengerBooking => {
  const passenger: PassengerBooking = {
    firstnames: [guest.firstName],
    lastnames: [guest.lastName],
    // contactInformation: guest.address.split(" "),
    type: DerbysoftGuestTypeToWTPassengerType(guest.type),
  };
  return passenger;
};

export const DerbysoftGuestTypeToWTPassengerType = (guestType: GuestType): PassengerType => {
  switch (guestType) {
    case GuestType.Adult:
      return "ADT";
    case GuestType.Child:
      return "CHD";
    case GuestType.Infant:
      return "INF";
    default:
      throw new HotelOTAError(`Invalid derbysoft guest type: ${guestType}`);
  }
};

export const toRoomCriteria = (passengers: PassengerSearch[], roomCount: number): RoomCriteria => {
  const childAges = [];
  let [adultCount, childCount] = [0, 0];
  for (const guest of passengers) {
    if (!guest) throw new HotelOTAError("Passenger element in array is undefined");

    switch (guest.type) {
      case "INF":
      case "CHD":
        childCount += guest.count;
        if (guest.childrenAges?.length) {
          if (guest.childrenAges.length !== guest.count) {
            throw new HotelOTAError(
              `'${guest.type}' childrenAges array elements is not equal to the children count`
            );
          }
          childAges.push(...guest.childrenAges);
        } else {
          throw new HotelOTAError(`'${guest.type}' passenger type must have childrenAges array`);
        }
        continue;

      case "ADT":
        adultCount += guest.count;
        continue;

      default:
        throw new HotelOTAError(`Invalid Passenger Type Code: ${guest.type}`);
    }
  }

  const result = new RoomCriteria();
  result.adultCount = adultCount;
  result.roomCount = roomCount;
  result.childCount = childCount;
  result.childAges = childAges;
  return result;
};
