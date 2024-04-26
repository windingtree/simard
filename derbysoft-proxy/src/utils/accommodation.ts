import { HotelOTAError } from "../types";

export type UniqueHotelId = {
  hotelId: string;
  supplierId: string;
};

export type ProviderPrefix = "DS" | "MW";

export const utf8ToHex = (str: string): string => {
  str = str || "";
  return `0x${Buffer.from(str, "utf8").toString("hex")}`;
};

export const hexToUTF8 = (str: string): string => {
  str = str || "";
  if (str.startsWith("0x")) {
    str = str.substring(2);
  }
  return `${Buffer.from(str, "hex").toString("utf8")}`;
};

export const encodeAccommodationId = (
  { hotelId, supplierId }: UniqueHotelId,
  providerPrefix: ProviderPrefix
): string => {
  const uniqueHotelId = encodeUniqueHotelId({ hotelId, supplierId });
  return utf8ToHex(`${providerPrefix}:${uniqueHotelId}`).replace("0x", "");
};

export const decodeAccommodationId = (
  accommodationId: string,
  providerPrefix: ProviderPrefix
): UniqueHotelId => {
  const id = hexToUTF8(accommodationId).split(":");
  const prefix = id[0];
  if (prefix !== providerPrefix) {
    throw new HotelOTAError(`Invalid accommodationId: '${accommodationId}'`, 400);
  }
  const uniqueHotelId = id[1];
  return decodeUniqueHotelId(uniqueHotelId);
};

const encodeUniqueHotelId = (uniqueHotelId: UniqueHotelId): string => {
  return `${uniqueHotelId.supplierId}-${uniqueHotelId.hotelId}`;
};

const decodeUniqueHotelId = (uniqueHotelId: string): UniqueHotelId => {
  const idParts = uniqueHotelId.split("-");
  if (idParts.length !== 2) {
    throw new HotelOTAError("Invalid unique hotel id string");
  }

  return {
    supplierId: idParts[0],
    hotelId: idParts[1],
  };
};

// This initially encoded rateId as well, which comes from roomProducts
// but not all suppliers return all available rate information/roomProducts
// also this is content related not rate related
// so only roomId is relevant and will be used henceforth.
export const encodeRoomTypeId = (hotelId: string, roomId: string): string => {
  return utf8ToHex(`${hotelId}:${roomId}`).replace("0x", "");
};

export const decodeRoomTypeId = (roomTypeId: string) => {
  const ids = hexToUTF8(roomTypeId).split(":");
  if (ids.length < 2) {
    throw new HotelOTAError("Decode Error: invalid roomTypeId");
  }

  return {
    hotelId: ids[0],
    roomId: ids[1],
    rateId: ids[2],
  };
};

export const getHotelIdFromAccommodationId = (
  accommodationId: string,
  supplierId: string
): string => {
  // decode accommodationId
  const { hotelId, supplierId: decodedSupplierId } = decodeAccommodationId(accommodationId, "DS");

  // ensure supplierId matches service supplierId
  if (supplierId !== decodedSupplierId) {
    throw new HotelOTAError(`Invalid accommodationId: '${accommodationId}'`, 400);
  }
  return hotelId;
};

export const getAccommodationIdFromHotelId = (hotelId: string, supplierId: string): string => {
  // encode accommodationId
  const accommodationId = encodeAccommodationId({ hotelId, supplierId }, "DS");
  return accommodationId;
};
