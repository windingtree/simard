import {
  Accommodation,
  Address,
  CheckInOutPolicy,
  ContactInformation,
  LoyaltyProgram,
  LoyaltyPrograms,
  MediaItem,
  Order,
  Price,
  PriceItem,
  RefundabilityPolicy,
  RoomAmenities,
  RoomTypePlan,
  RoomTypes,
} from "@windingtree/glider-types/dist/accommodations";
import { EDerbysoftHotel } from "../../database/models/EDerbysoftHotel";
import { ERoomType } from "../../database/models/ERoomType";
import { SMDTravelComponentHotel } from "@simardwt/winding-tree-utils";
import { EDerbysoftRoomTypeCustomData } from "../../types/database/EDerbysoftRoomTypeCustomData";
import { AvailableRoomRate, LoyaltyAccount, MealPlanDescription } from "@simardwt/derbysoft-types";
import { DerbysoftOfferPriceMetadata, DerbysoftPricingMetadata, HotelOTAError } from "../../types";
import { computePriceAndTaxes } from "../../converters/common/priceCalculator";
import { encodeAccommodationId, encodeRoomTypeId } from "../../utils/accommodation";
import { PassengerAddress } from "../common/augmentations";

export type RoomTypeMap = {
  roomTypeId: string;
  eRoomType: ERoomType;
};

export type RoomTypeFilter = "hasNoContent" | "hasNoProduct";

// TO-DO: update swagger CreateOfferResponse to include these optional details
// and define specific components in swagger for RetrieveOrderResponse
export interface OrderWithDetails extends Order {
  accommodation: Accommodation;
  roomRates: PriceItem[];
  price: Price;
  loyaltyPrograms?: LoyaltyPrograms;
  stayDetails: {
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
    numberOfRooms: number;
    roomType: RoomTypes;
    roomTypePlan: RoomTypePlan;
    refundability: RefundabilityPolicy;
  };
}

export const extractTravelComponentFromPricingMetaData = (
  pricingMetadata: DerbysoftPricingMetadata,
  reservationNumber: string,
  contactEmail: string[]
): SMDTravelComponentHotel => {
  const checkInDate = pricingMetadata.searchCriteria?.stayRange.checkin;
  const checkOutDate = pricingMetadata.searchCriteria?.stayRange.checkout;
  const roomRates = (
    [...Object.values(pricingMetadata.pricedOffers)] as DerbysoftOfferPriceMetadata[]
  ).map((price) => {
    const priceAndTaxes = computePriceAndTaxes(
      price.roomRate,
      price.roomRate.roomCriteria ?? pricingMetadata.searchCriteria.roomCriteria
    );

    return {
      dayRateAmount: priceAndTaxes.price.public,
      nightCount: priceAndTaxes.numberOfNights,
    };
  });

  return {
    checkInDate,
    checkOutDate,
    componentType: "hotel",
    folioNumber: reservationNumber,
    roomRates,
    contactEmail,
  };
};

export const getRoomTypePlan = (
  roomRate: AvailableRoomRate,
  customData: EDerbysoftRoomTypeCustomData
): RoomTypePlan => {
  return {
    mealPlanCode: roomRate.mealPlan,
    mealPlan: MealPlanDescription[roomRate.mealPlan],
    ratePlanDescription: customData?.rateDescription,
    ratePlan: customData?.rateName,
    ratePlanId: roomRate.rateId,
    roomId: roomRate.roomId,
    roomTypeId: roomRate.roomId,
  };
};

export const buildAccommodation = (
  hotelInfo: EDerbysoftHotel, // information coming from the db.
  roomTypesRef?: Map<string, RoomTypeMap>,
  returnAccommodationId = false,
  excludeRoomTypes: RoomTypeFilter[] = []
): Accommodation => {
  const hotelId = hotelInfo.providerHotelId;
  const name = hotelInfo.hotelName;
  const contactInformation = getContactInformation(hotelInfo);
  const description = hotelInfo.description;

  const location = {
    long: hotelInfo.location.coordinates[0],
    lat: hotelInfo.location.coordinates[1],
  };

  // build roomTypes & cancelPolicies
  const roomTypes = new Map();
  const cancelPoliciesMap = new Map<string, string>();

  // filter roomTypes if filters are provided
  let filteredRoomTypes = hotelInfo.roomTypes;
  if (excludeRoomTypes?.length) {
    filteredRoomTypes = hotelInfo.roomTypes?.filter((eRoomType) => {
      for (let idx = 0; idx < excludeRoomTypes.length; idx++) {
        const filter = excludeRoomTypes[idx];
        if (eRoomType.customData[filter]) {
          return false;
        }
      }

      return true;
    });
  }

  filteredRoomTypes?.forEach((eRoomType) => {
    // TODO: For now we use only the cancel policies of the shopping response.
    // In the future we could do some consolidation with the one coming from the hotel,
    // but for this we have to store it in db, today we store only one unstructured line.
    // Object.entries(eRoomType.policies).forEach(([code, policy]) => {
    //   cancelPoliciesMap.set(code, policy);
    // });

    // TODO: policies is not used anymore in the accommodation, change that when the swagger is updated.
    const customData = eRoomType.customData as EDerbysoftRoomTypeCustomData;

    const roomType = convertRoomTypeEntityToObject(eRoomType, cancelPoliciesMap);
    const roomTypeId = encodeRoomTypeId(hotelId, customData.roomId);

    roomTypes.set(roomTypeId, roomType);
    if (roomTypesRef) {
      roomTypesRef.set(roomTypeId, { roomTypeId, eRoomType });
    }
  });

  const media: MediaItem[] = hotelInfo.customData?.media?.map((x): MediaItem => {
    return {
      type: "photo",
      width: x.width,
      height: x.height,
      url: x.url,
    };
  });

  // TO-DO rating
  const rating = hotelInfo.rating;

  // console.log(JSON.stringify(hotelInfo.checkInOutPolicy, null, 2));
  // returns: { "checkoutTime": "11:00:00", "checkinTime": "15:00:00"} (instead of checkOutTime and checkinTime)

  // TODO: check this issue: fields contained in hotelInfo.checkInOutPolicy do not respect the type.
  const checkInTime: string =
    hotelInfo.checkInOutPolicy.checkinTime ?? hotelInfo.checkInOutPolicy["checkInTime"];
  const checkOutTime: string =
    hotelInfo.checkInOutPolicy.checkOutTime ?? hotelInfo.checkInOutPolicy["checkoutTime"];

  const checkinoutPolicy: CheckInOutPolicy = {
    checkinTime: checkInTime,
    checkoutTime: checkOutTime,
  };

  // otherPolicies from cancelPolicies
  const otherPolicies = Array.from(cancelPoliciesMap.values());

  let accommodationId: string;
  if (returnAccommodationId) {
    accommodationId = encodeAccommodationId(
      { hotelId, supplierId: hotelInfo.customData.supplierId },
      "DS"
    );
  }

  const accommodation: Accommodation = {
    accommodationId,
    hotelId,
    name,
    type: "hotel",
    description,
    location,
    rating,
    contactInformation,
    checkinoutPolicy,
    otherPolicies,
    media,
    roomTypes: Object.fromEntries(roomTypes),
  };

  return accommodation;
};

export const getContactInformation = (hotelInfo: EDerbysoftHotel): ContactInformation => {
  // picking only the first address from array of addresses
  const hotelAddress = hotelInfo.addresses[0];
  const country = hotelAddress.country;
  const streetAddress = hotelAddress.addressLine.join(", ");
  const locality = (hotelAddress.city ? hotelAddress.city + ", " : "") + hotelAddress.state ?? "";

  // build address
  const address: Address = {
    streetAddress,
    locality,
    country,
  };

  // TO-DO: build emails - no email provided
  const emails = hotelInfo.emails;

  // build phone numbers
  // we only get one number from derbysoft
  const phoneNumbers = !hotelInfo.phones
    ? null
    : hotelInfo.phones.map((phone) => {
        return [phone.countryAccessCode, phone.areaCityCode, phone.phoneNumber].join(" ");
      });

  // build contact info
  const contactInfo: ContactInformation = {
    address,
    phoneNumbers,
    emails,
  };

  return contactInfo;
};

export const convertRoomTypeEntityToObject = (
  eRoomType: ERoomType,
  cancelPoliciesMap: Map<string, string>
): RoomTypes => {
  const amenities: RoomAmenities[] = !eRoomType.amenities
    ? null
    : eRoomType.amenities.map((x): RoomAmenities => {
        return {
          name: x.name,
          description: x.description,
          otaCode: x.otaCode,
        };
      });

  const media: MediaItem[] = !eRoomType.media
    ? null
    : eRoomType.media.map((x): MediaItem => {
        return {
          type: "photo",
          width: x.width,
          height: x.height,
          url: x.url,
        };
      });

  const size = !eRoomType.size
    ? null
    : {
        value: eRoomType.size.value,
        unit: eRoomType.size.unit,
      };

  return {
    amenities: amenities,
    description: eRoomType.description,
    maximumOccupancy: {
      adults: eRoomType.maximumOccupancy?.adults,
      children: eRoomType.maximumOccupancy?.children,
    },
    media: media,
    name: eRoomType.name,
    policies: Object.fromEntries(cancelPoliciesMap),
    size,
  };
};

export const getRoomTypeFromAccommodation = (
  accommodation: Accommodation,
  roomTypeId: string
): RoomTypes => {
  return accommodation.roomTypes[roomTypeId];
};

export const loyaltyAccountToLoyaltyProgram = (loyaltyAccount: LoyaltyAccount): LoyaltyProgram => {
  if (!loyaltyAccount) return undefined;
  return {
    accountNumber: loyaltyAccount.accountId,
    programName: loyaltyAccount.programCode,
  };
};

export const loyaltyProgramToLoyaltyAccount = (loyaltyProgram: LoyaltyProgram): LoyaltyAccount => {
  if (!loyaltyProgram) return undefined;
  return {
    accountId: loyaltyProgram.accountNumber,
    programCode: loyaltyProgram.programName,
  };
};

export const passengerAddressToGuestAddress = (passengerAddress: PassengerAddress): string => {
  if (!passengerAddress)
    throw new HotelOTAError(
      "Passenger to guest address conversion error: No guest address provided",
      500
    );

  const addressArray: string[] = [];
  const { addressLine1, addressLine2, city, postalCode, countryCode } = passengerAddress;

  if (!addressLine1) throw new HotelOTAError("'addressLine1' is required", 400);
  addressArray.push(addressLine1);
  if (addressLine2) addressArray.push(addressLine2);
  if (postalCode) addressArray.push(postalCode);
  if (city) addressArray.push(city);
  if (countryCode) addressArray.push(countryCode);

  return addressArray.join(", ");
};
