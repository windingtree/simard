import { HotelDescriptiveContent } from "@simardwt/ota-types/dist/derbysoft";

export interface DerbysoftContentService {
  getHotels: (hotelCodeContext: string, lastModifyDateTime?: Date) => Promise<string[]>;
  getHotelsInfo: (hotelCodeContext: string, hotelIds: string[]) => Promise<HotelInfoMap>;
}

export interface HotelInfoMap {
  [hotelCode: string]: HotelDescriptiveContent;
}
