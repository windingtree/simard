import { OtaHotelSearchRq } from "@simardwt/ota-types";
import { OtaHotelSearchRs } from "@simardwt/ota-types";
import { OtaHotelDescriptiveInfoRq } from "@simardwt/ota-types";
import { OtaHotelDescriptiveInfoRs } from "@simardwt/ota-types";

export interface IHotelContentService {
  GetChangeHotels(
    otaHotelSearchRq: OtaHotelSearchRq,
    callback: (
      err: unknown,
      result: OtaHotelSearchRs,
      rawResponse: unknown,
      soapHeader: unknown,
      rawRequest: unknown
    ) => void
  ): void;
  GetHotelDescriptiveInfo(
    otaHotelDescriptiveInfoRq: OtaHotelDescriptiveInfoRq,
    callback: (
      err: unknown,
      result: OtaHotelDescriptiveInfoRs,
      rawResponse: unknown,
      soapHeader: unknown,
      rawRequest: unknown
    ) => void
  ): void;
}
